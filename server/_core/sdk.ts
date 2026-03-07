import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import { parse as parseCookieHeader } from "cookie";
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import { promisify } from "util";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";

const scrypt = promisify(scryptCallback);
const PASSWORD_KEY_LEN = 64;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

export type SessionPayload = {
  userId: number;
  email: string;
  name: string;
};

class AuthService {
  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) {
      return new Map<string, string>();
    }

    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }

  private getSessionSecret() {
    const secret = ENV.cookieSecret;
    if (!secret) {
      throw new Error("JWT_SECRET is required for authentication");
    }
    return new TextEncoder().encode(secret);
  }

  async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString("hex");
    const derived = (await scrypt(password, salt, PASSWORD_KEY_LEN)) as Buffer;
    return `${salt}:${derived.toString("hex")}`;
  }

  async verifyPassword(password: string, storedHash: string): Promise<boolean> {
    const [salt, keyHex] = storedHash.split(":");
    if (!salt || !keyHex) return false;

    const derived = (await scrypt(password, salt, PASSWORD_KEY_LEN)) as Buffer;
    const keyBuffer = Buffer.from(keyHex, "hex");

    if (keyBuffer.length !== derived.length) return false;
    return timingSafeEqual(keyBuffer, derived);
  }

  async createSessionToken(
    payload: SessionPayload,
    options: { expiresInMs?: number } = {}
  ): Promise<string> {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
    const secretKey = this.getSessionSecret();

    return new SignJWT({
      userId: payload.userId,
      email: payload.email,
      name: payload.name,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);
  }

  async verifySession(
    cookieValue: string | undefined | null
  ): Promise<SessionPayload | null> {
    if (!cookieValue) {
      return null;
    }

    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"],
      });

      const { userId, email, name } = payload as Record<string, unknown>;
      if (
        typeof userId !== "number" ||
        !isNonEmptyString(email) ||
        !isNonEmptyString(name)
      ) {
        return null;
      }

      return { userId, email, name };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }

  async authenticateRequest(req: Request): Promise<User> {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);

    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }

    const user = await db.getUserById(session.userId);

    if (!user) {
      throw ForbiddenError("User not found");
    }

    await db.upsertUser({
      openId: user.openId,
      lastSignedIn: new Date(),
    });

    return user;
  }
}

export const sdk = new AuthService();

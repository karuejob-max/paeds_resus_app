import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

const MIN_PASSWORD_LEN = 8;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitizeUser(user: Awaited<ReturnType<typeof db.getUserByEmail>>) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    loginMethod: user.loginMethod,
    createdAt: user.createdAt,
    lastSignedIn: user.lastSignedIn,
  };
}

export function registerAuthRoutes(app: Express) {
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const email =
      typeof req.body?.email === "string" ? normalizeEmail(req.body.email) : "";
    const password =
      typeof req.body?.password === "string" ? req.body.password : "";

    if (!isValidEmail(email)) {
      res.status(400).json({ error: "A valid email is required" });
      return;
    }

    if (password.length < MIN_PASSWORD_LEN) {
      res.status(400).json({
        error: `Password must be at least ${MIN_PASSWORD_LEN} characters`,
      });
      return;
    }

    try {
      const existing = await db.getUserByEmail(email);
      if (existing) {
        res.status(409).json({ error: "Email is already registered" });
        return;
      }

      const passwordHash = await sdk.hashPassword(password);
      await db.upsertUser({
        openId: `email:${email}`,
        email,
        name: name || null,
        passwordHash,
        loginMethod: "password",
        lastSignedIn: new Date(),
      });

      const user = await db.getUserByEmail(email);
      if (!user) {
        res.status(500).json({ error: "Failed to create account" });
        return;
      }

      const sessionToken = await sdk.createSessionToken({
        userId: user.id,
        email,
        name: user.name || email,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      res.status(201).json({ user: sanitizeUser(user) });
    } catch (error) {
      console.error("[Auth] Registration failed", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const email =
      typeof req.body?.email === "string" ? normalizeEmail(req.body.email) : "";
    const password =
      typeof req.body?.password === "string" ? req.body.password : "";

    if (!isValidEmail(email) || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    try {
      const user = await db.getUserByEmail(email);
      if (!user?.passwordHash) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      const valid = await sdk.verifyPassword(password, user.passwordHash);
      if (!valid) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      await db.upsertUser({
        openId: user.openId,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken({
        userId: user.id,
        email,
        name: user.name || email,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      res.status(200).json({ user: sanitizeUser(user) });
    } catch (error) {
      console.error("[Auth] Login failed", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    res.status(200).json({ success: true });
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      res.status(200).json({ user: sanitizeUser(user) });
    } catch {
      res.status(200).json({ user: null });
    }
  });
}

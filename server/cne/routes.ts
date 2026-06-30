import type { Express, Request, Response } from "express";
import { ZipArchive } from "archiver";
import { eq, and } from "drizzle-orm";
import { getDb } from "../db";
import { sdk } from "../_core/sdk";
import { institutionalAccounts, cneEvents, cneAttendees } from "../../drizzle/schema";
import type { User } from "../../drizzle/schema";
import {
  generateCneCertificatePdf,
  cneCertificateFilename,
  type CneCertificateData,
} from "./certificate";

/**
 * Express routes for CNE certificate downloads. These stream binary payloads
 * (single PDF + bulk ZIP) that tRPC's JSON transport can't handle efficiently.
 * Auth uses the same session flow as tRPC (sdk.authenticateRequest), plus an
 * institution-access check so only the owning institution (or an admin) can download.
 */

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

async function authenticate(req: Request): Promise<User | null> {
  try {
    return await sdk.authenticateRequest(req);
  } catch {
    return null;
  }
}

/** Returns true if `user` may access data for `institutionId`. Admins may access any. */
async function userCanAccessInstitution(
  db: Db,
  user: User,
  institutionId: number
): Promise<boolean> {
  if (user.role === "admin") {
    const [row] = await db
      .select({ id: institutionalAccounts.id })
      .from(institutionalAccounts)
      .where(eq(institutionalAccounts.id, institutionId))
      .limit(1);
    return !!row;
  }
  const [row] = await db
    .select({ userId: institutionalAccounts.userId })
    .from(institutionalAccounts)
    .where(eq(institutionalAccounts.id, institutionId))
    .limit(1);
  return !!row && row.userId === user.id;
}

async function buildCertificateData(
  db: Db,
  attendee: typeof cneAttendees.$inferSelect
): Promise<CneCertificateData> {
  const [event] = await db
    .select({ name: cneEvents.name, eventDate: cneEvents.eventDate })
    .from(cneEvents)
    .where(eq(cneEvents.id, attendee.cneEventId))
    .limit(1);
  const [inst] = await db
    .select({
      institutionName: institutionalAccounts.companyName,
      coordinatorName: institutionalAccounts.cneCoordinatorName,
      coordinatorSignature: institutionalAccounts.cneCoordinatorSignature,
    })
    .from(institutionalAccounts)
    .where(eq(institutionalAccounts.id, attendee.institutionalAccountId))
    .limit(1);
  return {
    fullName: attendee.fullName,
    cadre: attendee.cadre as CneCertificateData["cadre"],
    cadreOther: attendee.cadreOther,
    eventName: event?.name ?? "CNE Session",
    eventDate: event?.eventDate ?? "",
    coordinatorName: inst?.coordinatorName ?? null,
    coordinatorSignature: inst?.coordinatorSignature ?? null,
    institutionName: inst?.institutionName ?? "Healthcare Institution",
  };
}

/** Buffer a PassThrough PDF stream to a Buffer (for ZIP appends). */
function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (c: Buffer) => chunks.push(c));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

export function registerCneRoutes(app: Express): void {
  // Single certificate PDF: GET /api/cne/certificate/:attendeeId
  app.get("/api/cne/certificate/:attendeeId", async (req: Request, res: Response) => {
    const attendeeId = Number(req.params.attendeeId);
    if (!Number.isInteger(attendeeId) || attendeeId <= 0) {
      return res.status(400).json({ error: "Invalid attendee id" });
    }
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });

    const user = await authenticate(req);
    if (!user) return res.status(401).json({ error: "Authentication required" });

    const [attendee] = await db
      .select()
      .from(cneAttendees)
      .where(eq(cneAttendees.id, attendeeId))
      .limit(1);
    if (!attendee) return res.status(404).json({ error: "Attendee not found" });

    // Access is granted to: (a) the owning institution / admin (existing behavior),
    // or (b) the nurse themselves — when the logged-in user's email matches the
    // attendee's email. This powers the self-service "My CNE Certificates" portal
    // without weakening institution/admin access.
    const userEmail = (user.email ?? "").trim().toLowerCase();
    const isOwnCertificate = userEmail.length > 0 && userEmail === attendee.email.trim().toLowerCase();
    if (
      !isOwnCertificate &&
      !(await userCanAccessInstitution(db, user, attendee.institutionalAccountId))
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const data = await buildCertificateData(db, attendee);
    const filename = cneCertificateFilename(data.fullName, data.eventName);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    const pdfStream = generateCneCertificatePdf(data);
    pdfStream.on("error", (err) => {
      console.error("[CNE] certificate stream error:", err);
      if (!res.headersSent) res.status(500).json({ error: "Certificate generation failed" });
    });
    pdfStream.pipe(res);
  });

  // Bulk ZIP of all certificates for an event: GET /api/cne/certificate/bulk/:eventId
  app.get("/api/cne/certificate/bulk/:eventId", async (req: Request, res: Response) => {
    const eventId = Number(req.params.eventId);
    if (!Number.isInteger(eventId) || eventId <= 0) {
      return res.status(400).json({ error: "Invalid event id" });
    }
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });

    const user = await authenticate(req);
    if (!user) return res.status(401).json({ error: "Authentication required" });

    const [event] = await db
      .select()
      .from(cneEvents)
      .where(eq(cneEvents.id, eventId))
      .limit(1);
    if (!event) return res.status(404).json({ error: "Event not found" });

    if (!(await userCanAccessInstitution(db, user, event.institutionalAccountId))) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const attendees = await db
      .select()
      .from(cneAttendees)
      .where(
        and(
          eq(cneAttendees.cneEventId, eventId),
          eq(cneAttendees.institutionalAccountId, event.institutionalAccountId)
        )
      );

    if (!attendees.length) {
      return res.status(404).json({ error: "No registrations found for this event" });
    }

    const zipName = cneCertificateFilename("ALL", event.name).replace(/\.pdf$/i, ".zip");
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${zipName}"`);

    const archive = new ZipArchive({ zlib: { level: 9 } });
    archive.on("error", (err: Error) => {
      console.error("[CNE] bulk zip error:", err);
      if (!res.headersSent) res.status(500).json({ error: "ZIP generation failed" });
    });
    archive.pipe(res);

    const usedNames = new Set<string>();
    for (const attendee of attendees) {
      const data = await buildCertificateData(db, attendee);
      const buffer = await streamToBuffer(generateCneCertificatePdf(data));
      let name = cneCertificateFilename(data.fullName, data.eventName);
      // Avoid name collisions within the ZIP.
      if (usedNames.has(name)) {
        name = name.replace(/\.pdf$/i, `-${attendee.id}.pdf`);
      }
      usedNames.add(name);
      archive.append(buffer, { name });
    }

    await archive.finalize();
  });
}

import type { Express, Request, Response } from "express";
import { ZipArchive } from "archiver";
import { eq, and } from "drizzle-orm";
import { getDb } from "../db";
import { sdk } from "../_core/sdk";
import { institutionalAccounts, cpdEvents, cpdAttendees, cpdExportAuditLogs } from "../../drizzle/schema";
import type { User } from "../../drizzle/schema";
import { isInstitutionAdmin } from "../lib/institution-access";
import {
  generateCpdCertificatePdf,
  cpdCertificateFilename,
  type CpdCertificateData,
} from "./certificate";

/**
 * Express routes for CPD certificate downloads. These stream binary payloads
 * (single PDF + bulk ZIP) that tRPC's JSON transport can't handle efficiently.
 * Auth uses the same session flow as tRPC (sdk.authenticateRequest), plus an
 * institution-access check so only an institution admin (or a platform admin)
 * can download.
 */

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

async function authenticate(req: Request): Promise<User | null> {
  try {
    return await sdk.authenticateRequest(req);
  } catch {
    return null;
  }
}

/**
 * Returns true if `user` may access data for `institutionId`. Admins may
 * access any. Delegates to the shared multi-admin-aware check (North Star
 * §6.1) rather than the old owner-only comparison this used to do directly —
 * a granted admin (via institutionalAccountAdmins) needs the same access as
 * the original registering owner.
 */
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
  return isInstitutionAdmin(db, user.id, institutionId);
}

async function buildCertificateData(
  db: Db,
  attendee: typeof cpdAttendees.$inferSelect
): Promise<CpdCertificateData> {
  const [event] = await db
    .select({
      name: cpdEvents.name,
      eventDate: cpdEvents.eventDate,
      approvingCouncil: cpdEvents.approvingCouncil,
      cpdPoints: cpdEvents.cpdPoints,
    })
    .from(cpdEvents)
    .where(eq(cpdEvents.id, attendee.cpdEventId))
    .limit(1);
  const [inst] = await db
    .select({
      institutionName: institutionalAccounts.companyName,
      coordinatorName: institutionalAccounts.cpdCoordinatorName,
      coordinatorSignature: institutionalAccounts.cpdCoordinatorSignature,
    })
    .from(institutionalAccounts)
    .where(eq(institutionalAccounts.id, attendee.institutionalAccountId))
    .limit(1);
  return {
    fullName: attendee.fullName,
    cadre: attendee.cadre as CpdCertificateData["cadre"],
    cadreOther: attendee.cadreOther,
    eventName: event?.name ?? "CPD Session",
    eventDate: event?.eventDate ?? "",
    coordinatorName: inst?.coordinatorName ?? null,
    coordinatorSignature: inst?.coordinatorSignature ?? null,
    institutionName: inst?.institutionName ?? "Healthcare Institution",
    approvingCouncil: event?.approvingCouncil ?? null,
    cpdPoints: event?.cpdPoints ?? null,
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

export function registerCpdRoutes(app: Express): void {
  // Legacy CNE route compatibility redirects
  app.get("/api/cne/certificate/:attendeeId", (req: Request, res: Response) => {
    res.redirect(301, `/api/cpd/certificate/${req.params.attendeeId}`);
  });
  app.get("/api/cne/certificate/bulk/:eventId", (req: Request, res: Response) => {
    res.redirect(301, `/api/cpd/certificate/bulk/${req.params.eventId}`);
  });

  // Single certificate PDF: GET /api/cpd/certificate/:attendeeId
  app.get("/api/cpd/certificate/:attendeeId", async (req: Request, res: Response) => {
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
      .from(cpdAttendees)
      .where(eq(cpdAttendees.id, attendeeId))
      .limit(1);
    if (!attendee) return res.status(404).json({ error: "Attendee not found" });

    const [attendeeEvent] = await db
      .select({ lifecycleStatus: cpdEvents.lifecycleStatus, isOpen: cpdEvents.isOpen })
      .from(cpdEvents)
      .where(eq(cpdEvents.id, attendee.cpdEventId))
      .limit(1);
    if (attendee.attendanceStatus !== "attendance_verified") {
      return res.status(409).json({ error: "Certificate is available only after attendance has been verified." });
    }
    if (attendeeEvent?.isOpen || !["closed", "certificates_issued", "archived"].includes(attendeeEvent?.lifecycleStatus ?? "")) {
      return res.status(409).json({ error: "The CPD session must be closed before certificates are issued." });
    }

    // Access is granted to: (a) the owning institution / admin (existing behavior),
    // or (b) the user themselves — preferring stable attendee ownership and using
    // normalized email only for historical rows without a user link.
    const userEmail = (user.email ?? "").trim().toLowerCase();
    const isOwnCertificate = attendee.userId === user.id || (
      attendee.userId == null &&
      userEmail.length > 0 &&
      userEmail === attendee.email.trim().toLowerCase()
    );
    if (
      !isOwnCertificate &&
      !(await userCanAccessInstitution(db, user, attendee.institutionalAccountId))
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const data = await buildCertificateData(db, attendee);
    const filename = cpdCertificateFilename(data.fullName, data.eventName);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    const pdfStream = generateCpdCertificatePdf(data);
    pdfStream.on("error", (err) => {
      console.error("[CPD] certificate stream error:", err);
      if (!res.headersSent) res.status(500).json({ error: "Certificate generation failed" });
    });
    pdfStream.pipe(res);
  });

  // Bulk ZIP of all certificates for an event: GET /api/cpd/certificate/bulk/:eventId
  app.get("/api/cpd/certificate/bulk/:eventId", async (req: Request, res: Response) => {
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
      .from(cpdEvents)
      .where(eq(cpdEvents.id, eventId))
      .limit(1);
    if (!event) return res.status(404).json({ error: "Event not found" });

    if (!(await userCanAccessInstitution(db, user, event.institutionalAccountId))) {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (event.isOpen || !["closed", "certificates_issued", "archived"].includes(event.lifecycleStatus ?? "")) {
      return res.status(409).json({ error: "The CPD session must be closed before certificates are issued." });
    }

    const attendees = await db
      .select()
      .from(cpdAttendees)
      .where(
        and(
          eq(cpdAttendees.cpdEventId, eventId),
          eq(cpdAttendees.institutionalAccountId, event.institutionalAccountId),
          eq(cpdAttendees.attendanceStatus, "attendance_verified")
        )
      );

    if (!attendees.length) {
      return res.status(404).json({ error: "No verified attendance records found for this event" });
    }

    await db.insert(cpdExportAuditLogs).values({
      institutionalAccountId: event.institutionalAccountId,
      eventId,
      exportType: "certificates_zip",
      includesContactData: false,
      rowCount: attendees.length,
      actorUserId: user.id,
    });

    const zipName = cpdCertificateFilename("ALL", event.name).replace(/\.pdf$/i, ".zip");
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${zipName}"`);

    const archive = new ZipArchive({ zlib: { level: 9 } });
    archive.on("error", (err: Error) => {
      console.error("[CPD] bulk zip error:", err);
      if (!res.headersSent) res.status(500).json({ error: "ZIP generation failed" });
    });
    archive.pipe(res);

    const usedNames = new Set<string>();
    for (const attendee of attendees) {
      const data = await buildCertificateData(db, attendee);
      const buffer = await streamToBuffer(generateCpdCertificatePdf(data));
      let name = cpdCertificateFilename(data.fullName, data.eventName);
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

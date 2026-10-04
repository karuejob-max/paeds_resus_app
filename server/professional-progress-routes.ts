import type { Express, Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import { getDb } from "./db";
import { sdk } from "./_core/sdk";
import { professionalProgressReports, users } from "../drizzle/schema";
import type { User } from "../drizzle/schema";
import { generateProfessionalProgressPdf, professionalProgressPdfFilename, professionalProgressAppBase, type ProfessionalProgressPdfData } from "./lib/professional-progress-pdf";

async function authenticate(req: Request): Promise<User | null> {
  try {
    return await sdk.authenticateRequest(req);
  } catch {
    return null;
  }
}

function safeCode(value: string): boolean {
  return /^PPR-[A-F0-9]{24}$/.test(value);
}

function streamToResponse(stream: NodeJS.ReadableStream, res: Response) {
  stream.on("error", (error) => {
    console.error("[professional-progress-pdf] generation failed", error);
    if (!res.headersSent) res.status(500).json({ error: "Could not generate the report PDF" });
    else res.end();
  });
  stream.pipe(res);
}

export function registerProfessionalProgressRoutes(app: Express): void {
  app.get("/api/professional-progress/report/:verificationCode.pdf", async (req: Request, res: Response) => {
    const verificationCode = String(req.params.verificationCode ?? "").trim().toUpperCase();
    if (!safeCode(verificationCode)) return res.status(400).json({ error: "Invalid report ID" });

    const user = await authenticate(req);
    if (!user) return res.status(401).json({ error: "Authentication required" });
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });

    const rows = await db.select({ report: professionalProgressReports, subject: users }).from(professionalProgressReports).innerJoin(users, eq(users.id, professionalProgressReports.userId)).where(and(eq(professionalProgressReports.verificationCode, verificationCode), eq(professionalProgressReports.userId, user.id))).limit(1);
    const row = rows[0];
    if (!row) return res.status(404).json({ error: "Report not found" });
    if (row.report.status !== "active") return res.status(410).json({ error: `Report is ${row.report.status}` });
    if (row.report.publicExpiresAt && new Date(row.report.publicExpiresAt).getTime() < Date.now()) return res.status(410).json({ error: "Report has expired" });

    let snapshot: Record<string, unknown>;
    try {
      snapshot = JSON.parse(row.report.snapshotJson) as Record<string, unknown>;
    } catch {
      return res.status(500).json({ error: "Stored report snapshot is invalid" });
    }

    const data: ProfessionalProgressPdfData = {
      ...(snapshot as ProfessionalProgressPdfData),
      reportId: Number(row.report.id),
      verificationCode,
      verificationUrl: `${professionalProgressAppBase}/verify-progress/${verificationCode}`,
      snapshotHash: row.report.snapshotHash,
      generatedAt: row.report.generatedAt,
      reportScope: row.report.reportScope,
      subject: {
        name: row.subject.name,
        email: row.subject.email,
        cadre: row.subject.cadre,
      },
    };

    res.status(200);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${professionalProgressPdfFilename(data)}"`);
    res.setHeader("Cache-Control", "private, no-store");
    streamToResponse(generateProfessionalProgressPdf(data), res);
  });
}

import type { Express, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { sdk } from "../_core/sdk";
import { institutionalAccounts } from "../../drizzle/schema";
import { assertInstitutionAccess } from "../lib/institution-access";
import { getCohortProgressStats } from "../lib/cohort-progress";
import { generateCohortReadinessPdf, cohortReadinessFilename } from "../lib/cohort-readiness-pdf";

/**
 * INST-20: GET /api/institution/:institutionId/cohort-readiness-summary.pdf
 * A coordinator-triggered download of the executive-summary readiness PDF —
 * deliberately not a standing public link (see docs/INSTITUTIONAL_BACKLOG_
 * BOARD.md and the CEO's design sign-off in WORK_STATUS.md). Same reasoning
 * as registerCpdRoutes for using an Express route instead of a tRPC
 * procedure: this streams a binary payload tRPC's JSON transport can't
 * handle efficiently.
 */
export function registerInstitutionalReadinessRoutes(app: Express): void {
  app.get("/api/institution/:institutionId/cohort-readiness-summary.pdf", async (req: Request, res: Response) => {
    const institutionId = Number(req.params.institutionId);
    if (!Number.isInteger(institutionId) || institutionId <= 0) {
      return res.status(400).json({ error: "Invalid institution id" });
    }

    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });

    let user;
    try {
      user = await sdk.authenticateRequest(req);
    } catch {
      user = null;
    }
    if (!user) return res.status(401).json({ error: "Authentication required" });

    try {
      await assertInstitutionAccess(db, user, institutionId);
    } catch (e) {
      if (e instanceof TRPCError) {
        const status = e.code === "NOT_FOUND" ? 404 : e.code === "FORBIDDEN" ? 403 : 500;
        return res.status(status).json({ error: e.message });
      }
      return res.status(500).json({ error: "Access check failed" });
    }

    const [inst] = await db
      .select({ companyName: institutionalAccounts.companyName })
      .from(institutionalAccounts)
      .where(eq(institutionalAccounts.id, institutionId))
      .limit(1);

    const rows = await getCohortProgressStats(db, institutionId);
    const institutionName = inst?.companyName?.trim() || "Healthcare Institution";
    const filename = cohortReadinessFilename(institutionName);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    const pdfStream = generateCohortReadinessPdf(institutionName, rows);
    pdfStream.on("error", (err) => {
      console.error("[institutional-readiness] PDF stream error:", err);
      if (!res.headersSent) res.status(500).json({ error: "Summary generation failed" });
    });
    pdfStream.pipe(res);
  });
}

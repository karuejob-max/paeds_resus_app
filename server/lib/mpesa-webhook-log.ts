import type { Response } from "express";
import { getDb } from "../db";
import { mpesaWebhookLog, type InsertMpesaWebhookLog } from "../../drizzle/schema";

export type MpesaWebhookLogBuilder = Partial<InsertMpesaWebhookLog> & {
  callbackType: InsertMpesaWebhookLog["callbackType"];
};

function redactPayload(body: unknown): string {
  try {
    const raw = typeof body === "string" ? body : JSON.stringify(body);
    return raw.slice(0, 2000);
  } catch {
    return "";
  }
}

export function attachMpesaWebhookLogging(
  res: Response,
  builder: MpesaWebhookLogBuilder,
  reqBody: unknown
): void {
  if (!builder.payloadSnippet) {
    builder.payloadSnippet = redactPayload(reqBody);
  }
  res.on("finish", () => {
    void flushMpesaWebhookLog(builder, res.statusCode);
  });
}

export async function flushMpesaWebhookLog(
  builder: MpesaWebhookLogBuilder,
  httpStatus: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await db.insert(mpesaWebhookLog).values({
      callbackType: builder.callbackType,
      checkoutRequestId: builder.checkoutRequestId ?? null,
      resultCode: builder.resultCode ?? null,
      resultDesc: builder.resultDesc?.slice(0, 512) ?? null,
      httpStatus,
      outcome: builder.outcome ?? (httpStatus >= 500 ? "error" : "acknowledged"),
      paymentId: builder.paymentId ?? null,
      enrollmentId: builder.enrollmentId ?? null,
      amountCents: builder.amountCents ?? null,
      mpesaReceiptNumber: builder.mpesaReceiptNumber ?? null,
      errorMessage: builder.errorMessage?.slice(0, 4000) ?? null,
      payloadSnippet: builder.payloadSnippet?.slice(0, 4000) ?? null,
    });
  } catch (e) {
    console.error("[mpesaWebhookLog] insert failed:", e);
  }
}

export async function recordMpesaWebhookLog(entry: InsertMpesaWebhookLog): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(mpesaWebhookLog).values(entry);
  } catch (e) {
    console.error("[mpesaWebhookLog] insert failed:", e);
  }
}

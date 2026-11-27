import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { storagePut } from "../storage";

export const EVIDENCE_MAX_BYTES = 5 * 1024 * 1024;
export const EVIDENCE_CONTENT_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"] as const;

function bad(message: string): never {
  throw new TRPCError({ code: "BAD_REQUEST", message });
}

/** The first bytes must match the type the browser claims, so a renamed file is not accepted. */
function matchesSignature(contentType: string, bytes: Buffer): boolean {
  switch (contentType) {
    case "application/pdf":
      return bytes.subarray(0, 5).toString("latin1") === "%PDF-";
    case "image/jpeg":
      return bytes[0] === 0xff && bytes[1] === 0xd8;
    case "image/png":
      return bytes.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    case "image/webp":
      return bytes.subarray(0, 4).toString("latin1") === "RIFF" && bytes.subarray(8, 12).toString("latin1") === "WEBP";
    default:
      return false;
  }
}

export function decodeEvidenceFile(input: { base64: string; fileName: string; contentType: string }) {
  if (!(EVIDENCE_CONTENT_TYPES as readonly string[]).includes(input.contentType)) {
    bad("Upload a PDF, JPG, PNG or WebP file.");
  }
  const buffer = Buffer.from(input.base64.replace(/^data:[^;]+;base64,/, ""), "base64");
  if (buffer.length === 0) bad("That file is empty.");
  if (buffer.length > EVIDENCE_MAX_BYTES) bad("The file is larger than 5 MB. Upload a smaller scan or photo.");
  if (!matchesSignature(input.contentType, buffer)) bad("That file does not look like a valid " + input.contentType.split("/")[1].toUpperCase() + ".");
  const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "evidence";
  return { buffer, safeName };
}

/** Stores an evidence file privately under the institution's own prefix. */
export async function storeEvidenceFile(institutionId: number, input: { base64: string; fileName: string; contentType: string }) {
  const { buffer, safeName } = decodeEvidenceFile(input);
  const stored = await storagePut(`institution-verification/${institutionId}/${randomUUID()}-${safeName}`, buffer, input.contentType);
  return { key: stored.key, fileName: safeName, contentType: input.contentType };
}

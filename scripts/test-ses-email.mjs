/**
 * Send a test message through AWS SES using .env credentials.
 * Usage: node scripts/test-ses-email.mjs you@example.com
 */
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const to = process.argv[2];
if (!to) {
  console.error("Usage: node scripts/test-ses-email.mjs <recipient-email>");
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env");
const envText = readFileSync(envPath, "utf8");
const get = (key) => envText.match(new RegExp(`^${key}=(.+)$`, "m"))?.[1]?.trim();

const region = get("AWS_REGION") || "us-east-1";
const from = get("SES_FROM_EMAIL") || "noreply@paedsresus.com";
const accessKeyId = get("AWS_ACCESS_KEY_ID");
const secretAccessKey = get("AWS_SECRET_ACCESS_KEY");

if (!accessKeyId || !secretAccessKey) {
  console.error("Add AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and SES_FROM_EMAIL to .env first.");
  process.exit(1);
}

const client = new SESClient({ region, credentials: { accessKeyId, secretAccessKey } });
const command = new SendEmailCommand({
  Source: from,
  Destination: { ToAddresses: [to] },
  Message: {
    Subject: { Data: "Paeds Resus SES test", Charset: "UTF-8" },
    Body: {
      Text: {
        Data: "If you received this, SES is configured correctly for password reset emails.",
        Charset: "UTF-8",
      },
    },
  },
});

try {
  const res = await client.send(command);
  console.log("OK", { region, from, to, messageId: res.MessageId });
} catch (e) {
  console.error("SES error:", e.message || e);
  process.exit(1);
}

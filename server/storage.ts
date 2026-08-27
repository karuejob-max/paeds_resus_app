// Preconfigured storage helpers for Manus WebDev templates.
// Prefer the Biz-provided storage proxy; Render deployments fall back to the
// repository's documented private AWS S3 bucket when Forge variables are absent.

import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from "./_core/env";

type StorageConfig =
  | { kind: "forge"; baseUrl: string; apiKey: string }
  | { kind: "s3"; bucket: string; client: S3Client };

const SIGNED_URL_TTL_SECONDS = 15 * 60;

function getStorageConfig(): StorageConfig {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;

  if (baseUrl && apiKey) {
    return { kind: "forge", baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
  }

  const bucket = (process.env.AWS_S3_BUCKET ?? "").trim();
  const region = (process.env.AWS_REGION ?? process.env.AWS_SES_REGION ?? "").trim();
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();

  if (bucket && region) {
    return {
      kind: "s3",
      bucket,
      client: new S3Client({
        region,
        ...(accessKeyId && secretAccessKey
          ? { credentials: { accessKeyId, secretAccessKey } }
          : {}),
      }),
    };
  }

  throw new Error(
    "Storage is not configured: provide BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY, or AWS_REGION with AWS_S3_BUCKET and AWS credentials"
  );
}

function buildUploadUrl(baseUrl: string, relKey: string): URL {
  const url = new URL("v1/storage/upload", ensureTrailingSlash(baseUrl));
  url.searchParams.set("path", normalizeKey(relKey));
  return url;
}

async function buildDownloadUrl(
  baseUrl: string,
  relKey: string,
  apiKey: string,
): Promise<string> {
  const downloadApiUrl = new URL(
    "v1/storage/downloadUrl",
    ensureTrailingSlash(baseUrl),
  );
  downloadApiUrl.searchParams.set("path", normalizeKey(relKey));
  const response = await fetch(downloadApiUrl, {
    method: "GET",
    headers: buildAuthHeaders(apiKey),
  });
  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(
      `Storage download URL failed (${response.status} ${response.statusText}): ${message}`,
    );
  }
  return (await response.json()).url;
}

async function buildS3DownloadUrl(
  client: S3Client,
  bucket: string,
  relKey: string,
): Promise<string> {
  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: bucket, Key: normalizeKey(relKey) }),
    { expiresIn: SIGNED_URL_TTL_SECONDS },
  );
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function toFormData(
  data: Buffer | Uint8Array | string,
  contentType: string,
  fileName: string,
): FormData {
  const blob =
    typeof data === "string"
      ? new Blob([data], { type: contentType })
      : new Blob([data as any], { type: contentType });
  const form = new FormData();
  form.append("file", blob, fileName || "file");
  return form;
}

function buildAuthHeaders(apiKey: string): HeadersInit {
  return { Authorization: `Bearer ${apiKey}` };
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const config = getStorageConfig();
  const key = normalizeKey(relKey);

  if (config.kind === "s3") {
    await config.client.send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        Body: data,
        ContentType: contentType,
      }),
    );
    return {
      key,
      url: await buildS3DownloadUrl(config.client, config.bucket, key),
    };
  }

  const uploadUrl = buildUploadUrl(config.baseUrl, key);
  const formData = toFormData(data, contentType, key.split("/").pop() ?? key);
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: buildAuthHeaders(config.apiKey),
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(
      `Storage upload failed (${response.status} ${response.statusText}): ${message}`,
    );
  }
  const url = (await response.json()).url;
  return { key, url };
}

export async function storageGet(
  relKey: string,
): Promise<{ key: string; url: string }> {
  const config = getStorageConfig();
  const key = normalizeKey(relKey);

  if (config.kind === "s3") {
    return {
      key,
      url: await buildS3DownloadUrl(config.client, config.bucket, key),
    };
  }

  return {
    key,
    url: await buildDownloadUrl(config.baseUrl, key, config.apiKey),
  };
}

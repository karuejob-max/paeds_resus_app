import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run drizzle commands");
}

/** mysql2 ignores ssl-mode in URL — explicit ssl object required for Aiven. */
function getDbCredentials(databaseUrl: string) {
  const url = new URL(databaseUrl);
  const needsSsl =
    /ssl-mode=REQUIRED|ssl=true/i.test(databaseUrl) || url.hostname.endsWith(".aivencloud.com");
  const database = url.pathname.replace(/^\//, "") || undefined;
  const creds: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string | undefined;
    ssl?: { rejectUnauthorized: boolean };
  } = {
    host: url.hostname,
    port: url.port ? parseInt(url.port, 10) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: database || undefined,
  };
  if (needsSsl) {
    creds.ssl = { rejectUnauthorized: false };
  }
  return creds;
}

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: getDbCredentials(connectionString),
});

/**
 * mysql2 connection config for Aiven (SSL + IPv4 to avoid ETIMEDOUT on Windows).
 */
import dns from "node:dns";
import { promisify } from "node:util";

const lookup4 = promisify(dns.lookup);

export async function createMysqlConnection(databaseUrl, mysql) {
  const config = await getConnectionConfig(databaseUrl);
  return mysql.createConnection(config);
}

export async function getConnectionConfig(databaseUrl) {
  const url = new URL(databaseUrl);
  const needsSsl =
    /ssl-mode=REQUIRED|ssl=true/i.test(databaseUrl) || url.hostname.endsWith(".aivencloud.com");
  const database = url.pathname.replace(/^\//, "") || undefined;
  let host = url.hostname;
  try {
    const resolved = await lookup4(url.hostname, { family: 4 });
    host = resolved.address;
  } catch {
    // keep hostname
  }
  const config = {
    host,
    port: url.port ? parseInt(url.port, 10) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: database || undefined,
    connectTimeout: 60000,
  };
  if (needsSsl) {
    config.ssl = { rejectUnauthorized: false, servername: url.hostname };
  }
  return config;
}

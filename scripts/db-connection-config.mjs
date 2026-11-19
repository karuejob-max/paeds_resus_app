/**
 * mysql2 connection config for Aiven (SSL + IPv4 to avoid ETIMEDOUT on Windows).
 */
import dns from "node:dns";
import net from "node:net";
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
  let ipv4Address;
  try {
    const resolved = await lookup4(url.hostname, { family: 4 });
    ipv4Address = resolved.address;
  } catch {
    // Keep hostname; mysql2 can resolve it if the explicit IPv4 lookup fails.
  }
  const config = {
    // mysql2 derives TLS SNI from config.host, so keep the DNS hostname here.
    // The stream factory preserves the IPv4-only TCP connection behavior.
    host: url.hostname,
    port: url.port ? parseInt(url.port, 10) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: database || undefined,
    connectTimeout: 60000,
  };
  if (ipv4Address && ipv4Address !== url.hostname) {
    config.stream = () => {
      const stream = net.connect(config.port, ipv4Address);
      stream.setNoDelay(true);
      return stream;
    };
  }
  if (needsSsl) {
    config.ssl = { rejectUnauthorized: false, servername: url.hostname };
  }
  return config;
}

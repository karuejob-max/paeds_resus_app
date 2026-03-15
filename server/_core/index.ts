import "dotenv/config";

if (!process.env.DATABASE_URL?.trim()) {
  console.warn("[Server] DATABASE_URL is missing or empty. Database features (e.g. Create account) will not work.");
} else {
  console.log("[Server] DATABASE_URL is set.");
}

import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

let dbInitialized = false;

async function initializeDatabase() {
  if (dbInitialized) return;
  dbInitialized = true;

  try {
    const mysql = await import("mysql2/promise");
    const DATABASE_URL = process.env.DATABASE_URL;
    
    if (!DATABASE_URL) {
      console.log("[DB Init] DATABASE_URL not set, skipping");
      return;
    }

    const url = new URL(DATABASE_URL);
    const config: any = {
      host: url.hostname,
      port: url.port || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      ssl: { rejectUnauthorized: false },
      waitForConnections: true,
      connectionLimit: 1,
      queueLimit: 0,
    };

    const connection = await mysql.default.createConnection(config);
    console.log("[DB Init] Connected to database");

    const [columns] = await connection.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'users' AND TABLE_SCHEMA = ?
    `, [url.pathname.slice(1)]);

    const existingColumns = new Set((columns as any[]).map(c => c.COLUMN_NAME));
    console.log("[DB Init] Existing columns:", Array.from(existingColumns).join(", "));
    
    const requiredColumns = [
      { name: 'passwordHash', type: 'VARCHAR(255)', nullable: true },
      { name: 'loginMethod', type: 'VARCHAR(64)', nullable: true },
      { name: 'providerType', type: "ENUM('nurse', 'doctor', 'pharmacist', 'paramedic', 'lab_tech', 'respiratory_therapist', 'midwife', 'other')", nullable: true },
      { name: 'userType', type: "ENUM('individual', 'institutional', 'parent')", nullable: false, default: "'individual'" },
      { name: 'lastSignedIn', type: 'TIMESTAMP', nullable: false, default: 'CURRENT_TIMESTAMP' },
    ];

    const missingColumns = requiredColumns.filter(col => !existingColumns.has(col.name));
    console.log("[DB Init] Missing columns:", missingColumns.map(c => c.name).join(", ") || "none");

    if (missingColumns.length > 0) {
      console.log(`[DB Init] Adding ${missingColumns.length} missing column(s)...`);
      for (const col of missingColumns) {
        const nullableStr = col.nullable ? 'NULL' : 'NOT NULL';
        const defaultStr = col.default ? `DEFAULT ${col.default}` : '';
        const sql = `ALTER TABLE users ADD COLUMN ${col.name} ${col.type} ${nullableStr} ${defaultStr}`.trim();
        try {
          await connection.query(sql);
          console.log(`[DB Init] ✅ Added: ${col.name}`);
        } catch (err: any) {
          if (err.code !== 'ER_DUP_FIELDNAME') {
            console.error(`[DB Init] Error adding ${col.name}:`, err.message);
          }
        }
      }
    } else {
      console.log("[DB Init] All columns exist");
    }

    await connection.end();
    console.log("[DB Init] Complete");
  } catch (err: any) {
    console.error("[DB Init] Error:", err.message);
  }
}

async function startServer() {
  // Initialize database before starting server
  await initializeDatabase();

  const app = express();
  const server = createServer(app);

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(err => {
  console.error("[Server] Failed to start:", err);
  process.exit(1);
});

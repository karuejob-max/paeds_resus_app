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
import {
  handleMpesaWebhook,
  handleMpesaQueryWebhook,
  handleMpesaTimeoutWebhook,
  handleC2BValidation,
  handleC2BConfirmation,
} from "../webhooks/mpesa-webhook";

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

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // M-Pesa callbacks (single URL; Daraja sends STK result and C2B confirmations here)
  app.post("/api/payment/callback", express.json(), async (req, res) => {
    const body = req.body?.Body;
    
    // C2B URL Validation (Daraja sends this when registering the URL)
    if (!body && !req.body?.Body && Object.keys(req.body || {}).length === 0) {
      return handleC2BValidation(req as any, res);
    }
    
    // C2B Confirmation (actual payment confirmation from M-Pesa)
    if (req.body?.TransID && req.body?.TransAmount) {
      return handleC2BConfirmation(req as any, res);
    }
    
    // STK Push Query Response
    if (body?.checkoutQueryResponse) {
      return handleMpesaQueryWebhook(req as any, res);
    }
    
    // STK Push Callback
    if (body?.stkCallback) {
      const code = body.stkCallback?.ResultCode;
      if (code === 0) {
        return handleMpesaWebhook(req as any, res);
      }
      return handleMpesaTimeoutWebhook(req as any, res);
    }
    
    return res.status(400).json({ error: "Invalid webhook payload" });
  });

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

startServer().catch(console.error);

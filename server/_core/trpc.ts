import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import * as db from "../db";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

/** Enforces server-side admin role and logs every admin action to adminAuditLog (path + input keys). Use for all admin-only procedures. */
export const adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    const result = await next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });

    // Phase 3: audit log admin actions (non-blocking)
    const inputSummary =
      typeof opts.rawInput === "object" && opts.rawInput !== null
        ? JSON.stringify(Object.keys(opts.rawInput as object))
        : undefined;
    db.insertAdminAuditLog({
      adminUserId: ctx.user.id,
      procedurePath: opts.path,
      inputSummary: inputSummary ?? undefined,
    }).catch((e) => console.warn("[Audit] log failed:", e));

    return result;
  }),
);

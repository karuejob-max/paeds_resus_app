import AdminShell from "@/components/AdminShell";
import AhaAccessGrantPanel from "@/components/AhaAccessGrantPanel";
import GlobalEntitlementPanel from "@/components/GlobalEntitlementPanel";
import { AlertTriangle, KeyRound, ShieldCheck } from "lucide-react";

export default function AdminAccessGrants() {
  return (
    <AdminShell>
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 rounded-2xl border bg-background p-5 shadow-sm md:flex-row md:items-start md:justify-between md:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <KeyRound className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary">Global Admin · Access & entitlements</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight">Access grants</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                Issue named, auditable free or discounted access to Paeds Resus programmes and services. Use a grant when a person or institution has an approved business reason for access outside the standard payment path.
              </p>
            </div>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
            <AlertTriangle className="mr-1.5 inline h-3.5 w-3.5" />
            Access grants do not bypass clinical prerequisites, eligibility, assessment, or certificate safeguards.
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border bg-background p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Named and scoped</p>
            <p className="mt-1 text-sm font-medium">Select an existing account or institution</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Grants are not shareable learner tokens.</p>
          </div>
          <div className="rounded-xl border bg-background p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Commercial control</p>
            <p className="mt-1 text-sm font-medium">Full waiver or percentage discount</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Set expiry and maximum redemptions before issuing.</p>
          </div>
          <div className="rounded-xl border bg-background p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Auditability</p>
            <p className="mt-1 text-sm font-medium">Every grant has a reason and history</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Active grants can be revoked with a recorded reason.</p>
          </div>
        </div>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold">Paeds Resus programmes and services</h2>
              <p className="text-sm text-muted-foreground">Use this for IERP, NERP, ILSP, and self-pay learning access.</p>
            </div>
          </div>
          <GlobalEntitlementPanel />
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">AHA course review access</h2>
            <p className="text-sm text-muted-foreground">Use this for named AHA reviewer or authorised learner access.</p>
          </div>
          <AhaAccessGrantPanel />
        </section>
      </div>
    </AdminShell>
  );
}

import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AdminShell from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { adminNavigationGroups, type AdminRouteItem } from "@/const/admin-navigation";
import { AlertTriangle, ArrowRight, CheckCircle2, ImageIcon, KeyRound, Loader2, Shield } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";

export default function AdminHub() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      setLocation("/login");
      return;
    }
    if ((user as { role?: string })?.role !== "admin") {
      setLocation("/");
    }
  }, [user, isAuthenticated, loading, setLocation]);

  if (loading || !isAuthenticated || (user as { role?: string })?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <AdminShell>
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 rounded-2xl border bg-background p-5 shadow-sm md:flex-row md:items-start md:justify-between md:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary">Paeds Resus · Global Admin</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight">Platform overview</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                Start with the work area that matches the decision you need to make. Use Access grants for approved free or discounted access, and switch to Institution Workspace for tenant-scoped administration.
              </p>
            </div>
          </div>
          <Button type="button" variant="outline" onClick={() => setLocation("/institution")} className="shrink-0">
            Switch to Institution Workspace <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </header>

        <section className="grid gap-4 md:grid-cols-3" aria-label="Priority admin actions">
          <PriorityCard
            title="Access grants"
            description="Issue named, auditable free or discounted programme access."
            href="/admin/access-grants"
            icon={<KeyRound className="h-5 w-5 text-primary" />}
            action="Open grants"
          />
          <PriorityCard
            title="Platform Ops"
            description="Inspect errors, stuck workflows, and operational health."
            href="/admin/ops"
            icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
            action="Open operations"
          />
          <PriorityCard
            title="Review queues"
            description="Review Care Signal, Code Signal, and capstone items awaiting action."
            href="/admin/care-signal-review"
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
            action="Open review"
          />
        </section>

        <section aria-labelledby="work-areas-heading" className="space-y-3">
          <div>
            <h2 id="work-areas-heading" className="text-lg font-semibold">Work areas</h2>
            <p className="text-sm text-muted-foreground">Every destination is grouped by the type of admin work it supports.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {adminNavigationGroups
              .filter(group => group.label !== "Overview" && group.label !== "Maintenance")
              .map(group => {
                const GroupIcon = group.icon;
                return (
                  <Card key={group.label} className="border-border/80 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <GroupIcon className="h-4 w-4 text-primary" />
                        {group.label}
                      </CardTitle>
                      <CardDescription>
                        {group.items.length} destination{group.items.length === 1 ? "" : "s"} available
                      </CardDescription>
                    </CardHeader>
                    <div className="space-y-1 px-6 pb-5">
                      {group.items.map(item => <DestinationLink key={item.href} item={item} onNavigate={setLocation} />)}
                    </div>
                  </Card>
                );
              })}
          </div>
        </section>

        <MaintenanceCard />
      </div>
    </AdminShell>
  );
}

function PriorityCard({
  title,
  description,
  href,
  icon,
  action,
}: {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
  action: string;
}) {
  const [, setLocation] = useLocation();
  return (
    <Card className="border-primary/15 bg-background shadow-sm transition-colors hover:border-primary/40">
      <CardHeader>
        <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-muted">{icon}</div>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription className="min-h-10">{description}</CardDescription>
        <Button type="button" variant="link" className="h-auto justify-start px-0 pt-3" onClick={() => setLocation(href)}>
          {action} <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </CardHeader>
    </Card>
  );
}

function DestinationLink({ item, onNavigate }: { item: AdminRouteItem; onNavigate: (href: string) => void }) {
  const ItemIcon = item.icon;
  return (
    <button
      type="button"
      onClick={() => onNavigate(item.href)}
      className="group flex w-full items-start gap-3 rounded-lg p-2 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ItemIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
      <span className="min-w-0">
        <span className="flex items-center gap-2 text-sm font-medium">
          {item.label}
          {item.badge ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">{item.badge}</span> : null}
        </span>
        <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{item.description}</span>
      </span>
      <ArrowRight className="ml-auto mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}

function MaintenanceCard() {
  const { toast } = useToast();
  const [done, setDone] = useState(false);
  const migrate = trpc.adminStats.runImageMigration.useMutation({
    onSuccess: data => {
      setDone(true);
      toast({
        title: data.updated > 0 ? "Migration complete" : "Already migrated",
        description: data.message,
      });
    },
    onError: error => {
      toast({ title: "Migration failed", description: error.message, variant: "destructive" });
    },
  });

  return (
    <section aria-labelledby="maintenance-heading" className="rounded-xl border border-slate-200 bg-background p-4 shadow-sm md:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <ImageIcon className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
          <div>
            <h2 id="maintenance-heading" className="text-sm font-semibold">Maintenance</h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Rare, privileged technical actions. Course image URL migration is safe to run repeatedly but should not be treated as routine admin work.
            </p>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          variant={done ? "outline" : "default"}
          disabled={migrate.isPending || done}
          onClick={() => migrate.mutate()}
          className="shrink-0"
        >
          {migrate.isPending ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Running…</> : done ? <><CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />Done</> : "Run image migration"}
        </Button>
      </div>
    </section>
  );
}

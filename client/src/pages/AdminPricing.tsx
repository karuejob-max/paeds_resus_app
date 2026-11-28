import { useState } from "react";
import { Tag } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";

type Program = "bls" | "acls" | "pals" | "heartsaver" | "nrp" | "instructor";
const kes = (n: number) => `KES ${n.toLocaleString()}`;
const fmt = (d: Date | string | null) => (d ? new Date(d).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "—");

export default function AdminPricing() {
  const utils = trpc.useUtils();
  const overview = trpc.pricing.adminOverview.useQuery();
  const refresh = () => {
    void utils.pricing.adminOverview.invalidate();
    void utils.pricing.current.invalidate();
  };
  const fail = (e: { message: string }) => toast.error(e.message);
  const setStandard = trpc.pricing.setStandard.useMutation({ onSuccess: () => { toast.success("Standard price updated."); refresh(); }, onError: fail });
  const createOffer = trpc.pricing.createOffer.useMutation({ onSuccess: () => { toast.success("Offer saved."); refresh(); }, onError: fail });
  const endOffer = trpc.pricing.endOffer.useMutation({ onSuccess: () => { toast.success("Offer ended."); refresh(); }, onError: fail });

  const [offer, setOffer] = useState({ program: "bls" as Program, price: "", label: "", startsAt: "", endsAt: "" });
  const [standard, setStd] = useState<Record<string, string>>({});
  const data = overview.data;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex items-start gap-3 rounded-2xl border bg-background p-5 shadow-sm">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Tag className="h-6 w-6" /></div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pricing and offers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Self-pay prices for individual programmes. Prices and offers apply to M-Pesa STK push straight away, so there is no need to issue access grants for a promotion.
            Anyone who paid during an offer keeps their access after it ends.
          </p>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current prices</CardTitle>
          <CardDescription>What a learner pays right now.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {data?.programmes.map((p) => (
            <div key={p.programType} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm">
              <div>
                <p className="font-medium">{p.label}</p>
                <p className="text-xs text-muted-foreground">
                  {p.offer ? `Offer running: ${p.offer.label ?? "Special offer"} (standard ${kes(p.standardKes)})` : "Standard price"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold tabular-nums">{kes(p.priceKes)}</span>
                {p.offer ? <Badge variant="outline" className="border-emerald-300 text-emerald-700">Offer</Badge> : null}
                <Input
                  className="w-28"
                  type="number"
                  placeholder="New standard"
                  value={standard[p.programType] ?? ""}
                  onChange={(e) => setStd((s) => ({ ...s, [p.programType]: e.target.value }))}
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!standard[p.programType] || setStandard.isPending}
                  onClick={() => {
                    const value = Number(standard[p.programType]);
                    if (!window.confirm(`Change the standard ${p.label} price to ${kes(value)} for everyone from now on?`)) return;
                    setStandard.mutate({ programType: p.programType as Program, priceKes: value });
                    setStd((s) => ({ ...s, [p.programType]: "" }));
                  }}
                >
                  Set standard
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">New offer</CardTitle>
          <CardDescription>A limited-time price, for example Black November. It ends by itself on the end date.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            Programme
            <select className="w-full rounded-md border bg-background px-3 py-2" value={offer.program} onChange={(e) => setOffer({ ...offer, program: e.target.value as Program })}>
              {data?.programmes.map((p) => <option key={p.programType} value={p.programType}>{p.label}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            Offer price (KES)
            <Input type="number" value={offer.price} onChange={(e) => setOffer({ ...offer, price: e.target.value })} placeholder="5500" />
          </label>
          <label className="space-y-1 text-sm sm:col-span-2">
            Name shown to learners
            <Input value={offer.label} onChange={(e) => setOffer({ ...offer, label: e.target.value })} placeholder="Black November offer" />
          </label>
          <label className="space-y-1 text-sm">
            Starts
            <Input type="datetime-local" value={offer.startsAt} onChange={(e) => setOffer({ ...offer, startsAt: e.target.value })} />
          </label>
          <label className="space-y-1 text-sm">
            Ends
            <Input type="datetime-local" value={offer.endsAt} onChange={(e) => setOffer({ ...offer, endsAt: e.target.value })} />
          </label>
          <div className="sm:col-span-2">
            <Button
              disabled={!offer.price || !offer.label || !offer.startsAt || !offer.endsAt || createOffer.isPending}
              onClick={() =>
                createOffer.mutate({ programType: offer.program, priceKes: Number(offer.price), label: offer.label, startsAt: new Date(offer.startsAt), endsAt: new Date(offer.endsAt) })
              }
            >
              Save offer
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Running and upcoming offers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data && data.offers.length === 0 ? <p className="text-sm text-muted-foreground">No offers.</p> : null}
          {data?.offers.map((o) => (
            <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm">
              <div>
                <p className="font-medium">{o.label} · {o.programType.toUpperCase()} · {kes(o.priceKes)}</p>
                <p className="text-xs text-muted-foreground">{fmt(o.startsAt)} to {fmt(o.endsAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{o.running ? "Running" : "Scheduled"}</Badge>
                <Button size="sm" variant="ghost" className="text-red-700" disabled={endOffer.isPending} onClick={() => window.confirm("End this offer now? People who already paid keep their access.") && o.id && endOffer.mutate({ id: o.id })}>
                  {o.running ? "End now" : "Cancel"}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

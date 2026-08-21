import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Wrench } from "lucide-react";

export function InstitutionConnectedServicesPanel({ institutionId }: { institutionId: number }) {
  const { data: services, isLoading } = trpc.institutionProducts.getConnectedServices.useQuery({ institutionId });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5" />Connected Services</CardTitle>
        <CardDescription>Capabilities outside the IERS and CPD Portal core products remain visible, owned, and reviewable here until their final product home is decided.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? <p className="text-sm text-muted-foreground">Loading connected services…</p> : (
          <div className="grid gap-4 md:grid-cols-2">
            {(services ?? []).map((service) => (
              <div key={service.serviceKey} className="rounded-lg border border-dashed p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{service.displayName}</div>
                    <p className="mt-1 text-sm text-muted-foreground">{service.description}</p>
                  </div>
                  <Badge variant="outline">{service.lifecycleStatus}</Badge>
                </div>
                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <p><span className="font-medium text-foreground">Owner:</span> {service.owner}</p>
                  <p><span className="font-medium text-foreground">Status:</span> {service.reviewLabel}</p>
                </div>
                <Button asChild variant="ghost" size="sm" className="mt-3 px-0">
                  <a href={service.routeKey}>Open current service <ExternalLink className="ml-2 h-3.5 w-3.5" /></a>
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default InstitutionConnectedServicesPanel;

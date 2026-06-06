import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plug, HeartHandshake } from "lucide-react";

/**
 * Phase 4 — Partnership placeholders (UI stubs only).
 * Laerdal QCPR and HeartCode reseller integrations are not wired in v1.
 */
export function PartnershipPlaceholders() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="border-dashed opacity-80">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plug className="h-4 w-4" />
            Laerdal QCPR
            <Badge variant="secondary">Coming soon</Badge>
          </CardTitle>
          <CardDescription>
            Placeholder for manikin-linked compression quality feedback via Laerdal QCPR API.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          {/* Integration stub: OAuth + session sync with QCPR SDK — see docs when partnership active */}
          Compression depth, rate, and recoil metrics would stream into Practice Lab debrief event logs.
        </CardContent>
      </Card>

      <Card className="border-dashed opacity-80">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <HeartHandshake className="h-4 w-4" />
            HeartCode reseller path
            <Badge variant="secondary">Coming soon</Badge>
          </CardTitle>
          <CardDescription>
            Placeholder for AHA HeartCode completion sync for blended learning providers.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          {/* Integration stub: HeartCode xAPI / completion webhook — reseller agreement required */}
          Would cross-reference HeartCode cognitive completion with Paeds Resus hands-on booking.
        </CardContent>
      </Card>
    </div>
  );
}

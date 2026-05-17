import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { exposeAspirationalSurfaces } from "@/lib/aspirationalSurfaces";
import { AlertTriangle } from "lucide-react";
import { Link } from "wouter";

type Props = {
  title: string;
  children: React.ReactNode;
};

/**
 * Blocks mock / aspirational dashboards in production (Codex audit).
 * Enable with VITE_EXPOSE_ASPIRATIONAL_APIS=true (and server ENABLE_ASPIRATIONAL_APIS for APIs).
 */
export function AspirationalSurfaceGate({ title, children }: Props) {
  if (exposeAspirationalSurfaces()) {
    return <>{children}</>;
  }

  return (
    <div className="max-w-lg mx-auto p-6 space-y-4">
      <Alert variant="destructive" className="border-amber-500/50 bg-amber-500/10">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-900">Preview not available in production</AlertTitle>
        <AlertDescription className="text-amber-900/90 space-y-2">
          <p>
            <strong>{title}</strong> uses simulated data and is not part of the supported clinical
            product surface.
          </p>
          <p className="text-sm">
            For bedside workflow use <strong>ResusGPS</strong>; for learning use enrolled courses from
            your hub.
          </p>
        </AlertDescription>
      </Alert>
      <div className="flex flex-col gap-2">
        <Link href="/resus">
          <Button className="w-full">Open ResusGPS</Button>
        </Link>
        <Link href="/home">
          <Button variant="outline" className="w-full">
            Back to hub
          </Button>
        </Link>
      </div>
    </div>
  );
}

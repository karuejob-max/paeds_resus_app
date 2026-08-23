import { useLocation } from "wouter";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProviderIersErcoStaffingPanel from "@/components/ProviderIersErcoStaffingPanel";

export default function ProviderIersStaffing() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="mx-auto max-w-3xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-rose-700"><ShieldCheck className="h-4 w-4" />Individual IERS platform</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">Department UTL staffing</h1>
            <p className="mt-1 text-sm text-slate-600">Accepted ERCos can manage their own department’s dated UTL assignments here.</p>
          </div>
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => setLocation("/home")}><ArrowLeft className="mr-2 h-4 w-4" />Provider dashboard</Button>
        </div>
        <ProviderIersErcoStaffingPanel />
      </div>
    </div>
  );
}

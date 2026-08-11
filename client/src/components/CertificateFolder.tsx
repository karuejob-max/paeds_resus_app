/**
 * Collapsible "folder" wrapper for a group of certificates — CEO-requested
 * 2026-08-11 ("organize My Certificates into grouped folders: Life
 * Support, Fellowship, CPD"). Purely presentational; each group's actual
 * data/filtering lives in ProviderDashboard.tsx.
 */
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Folder, FolderOpen, ChevronDown, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  label: string;
  count: number;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
};

export function CertificateFolder({ label, count, isOpen, onToggle, children }: Props) {
  return (
    <div className="rounded-lg border">
      <Button
        variant="ghost"
        className="w-full justify-between px-3 py-2 h-auto font-medium text-sm"
        onClick={onToggle}
      >
        <span className="flex items-center gap-2">
          {isOpen ? (
            <FolderOpen className="h-4 w-4 text-amber-600" />
          ) : (
            <Folder className="h-4 w-4 text-amber-600" />
          )}
          {label}
          <Badge variant="secondary">{count}</Badge>
        </span>
        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </Button>
      {isOpen && <div className="px-3 pb-3 pt-1">{children}</div>}
    </div>
  );
}

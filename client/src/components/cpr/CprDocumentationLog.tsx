/**
 * CPR-GPS documentation log — each clinical action logged via explicit user click.
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList } from 'lucide-react';

export interface CprDocumentationEntry {
  id: string;
  timestamp: number;
  action: string;
  details?: string;
}

interface Props {
  entries: CprDocumentationEntry[];
  formatTime: (seconds: number) => string;
  onLogQuickAction?: (action: string, details?: string) => void;
  className?: string;
}

const QUICK_ACTIONS: Array<{ action: string; details?: string }> = [
  { action: 'Rhythm check documented' },
  { action: 'Reassessment completed' },
  { action: 'Reversible causes reviewed', details: 'Hs & Ts reviewed between cycles' },
  { action: 'IV/IO access obtained' },
  { action: 'Defibrillator charged' },
];

export function CprDocumentationLog({
  entries,
  formatTime,
  onLogQuickAction,
  className = '',
}: Props) {
  return (
    <Card className={`bg-gray-900 border-gray-700 ${className}`}>
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm md:text-base text-white flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-cyan-400" />
          Documentation log
        </CardTitle>
        <p className="text-xs text-gray-400">Tap an action to log what was done and when.</p>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0 space-y-3">
        {onLogQuickAction && (
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((item) => (
              <Button
                key={item.action}
                type="button"
                size="sm"
                variant="outline"
                className="text-xs border-gray-600 text-gray-200 hover:bg-gray-800"
                onClick={() => onLogQuickAction(item.action, item.details)}
              >
                {item.action}
              </Button>
            ))}
          </div>
        )}
        <div className="max-h-40 overflow-y-auto space-y-1">
          {entries.length === 0 ? (
            <p className="text-xs text-gray-500 py-2">No events logged yet.</p>
          ) : (
            entries.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className="w-full text-left rounded-md px-2 py-1.5 hover:bg-gray-800 border border-transparent hover:border-gray-700 transition-colors"
                onClick={() => onLogQuickAction?.(entry.action, entry.details)}
                title="Re-log this action type at current time"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-mono text-cyan-400 shrink-0">
                    {formatTime(entry.timestamp)}
                  </span>
                  <span className="text-xs md:text-sm text-white font-medium text-right flex-1">
                    {entry.action}
                  </span>
                </div>
                {entry.details && (
                  <p className="text-xs text-gray-400 mt-0.5 pl-0">{entry.details}</p>
                )}
              </button>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

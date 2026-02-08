/**
 * ProtocolChecklist - Toggleable checklist for protocol steps
 * 
 * Allows providers to track completion of protocol-specific steps
 * (e.g., DKA checklist, sepsis bundle). Extracted from DKA protocol.
 */

import { useState } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ChecklistItem {
  id: string;
  label: string;
  detail?: string;
}

interface Props {
  title: string;
  items: ChecklistItem[];
  onToggle?: (itemId: string, completed: boolean) => void;
  initialCompleted?: string[];
}

export function ProtocolChecklist({ title, items, onToggle, initialCompleted = [] }: Props) {
  const [completedItems, setCompletedItems] = useState<Set<string>>(
    new Set(initialCompleted)
  );

  const toggleItem = (itemId: string) => {
    const newCompleted = new Set(completedItems);
    if (newCompleted.has(itemId)) {
      newCompleted.delete(itemId);
      onToggle?.(itemId, false);
    } else {
      newCompleted.add(itemId);
      onToggle?.(itemId, true);
    }
    setCompletedItems(newCompleted);
  };

  const completionPercent = (completedItems.size / items.length) * 100;

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-sm">{title}</CardTitle>
          <span className="text-xs text-gray-400">
            {completedItems.size}/{items.length} ({Math.round(completionPercent)}%)
          </span>
        </div>
        {/* Progress bar */}
        <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => {
          const isCompleted = completedItems.has(item.id);
          return (
            <button
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={`w-full flex items-start gap-3 p-2 rounded transition-colors ${
                isCompleted
                  ? 'bg-green-900/30 hover:bg-green-900/40'
                  : 'bg-gray-800/50 hover:bg-gray-800'
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              ) : (
                <Circle className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 text-left">
                <p
                  className={`text-sm ${
                    isCompleted ? 'text-green-200 line-through' : 'text-white'
                  }`}
                >
                  {item.label}
                </p>
                {item.detail && (
                  <p className="text-xs text-gray-400 mt-0.5">{item.detail}</p>
                )}
              </div>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}

import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface FeedbackAlert {
  type: 'critical' | 'warning' | 'info' | 'action';
  title: string;
  message: string;
  actionItems?: string[];
  timestamp?: Date;
}

interface RealTimeFeedbackProps {
  alerts: FeedbackAlert[];
  onDismiss?: (index: number) => void;
}

export const RealTimeFeedback: React.FC<RealTimeFeedbackProps> = ({ alerts, onDismiss }) => {
  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 max-w-md space-y-3 z-50">
      {alerts.map((alert, index) => (
        <Card
          key={index}
          className={`p-4 border-l-4 animate-in slide-in-from-top ${
            alert.type === 'critical'
              ? 'bg-red-900 border-red-500 text-red-100'
              : alert.type === 'warning'
              ? 'bg-yellow-900 border-yellow-500 text-yellow-100'
              : alert.type === 'action'
              ? 'bg-blue-900 border-blue-500 text-blue-100'
              : 'bg-green-900 border-green-500 text-green-100'
          }`}
        >
          <div className="flex items-start gap-3">
            {alert.type === 'critical' && <AlertCircle className="w-5 h-5 flex-shrink-0 mt-1" />}
            {alert.type === 'warning' && <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-1" />}
            {alert.type === 'action' && <Zap className="w-5 h-5 flex-shrink-0 mt-1" />}
            {alert.type === 'info' && <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-1" />}
            
            <div className="flex-1">
              <h3 className="font-bold text-sm">{alert.title}</h3>
              <p className="text-xs mt-1">{alert.message}</p>
              
              {alert.actionItems && alert.actionItems.length > 0 && (
                <ul className="text-xs mt-2 space-y-1 list-disc list-inside">
                  {alert.actionItems.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
            
            {onDismiss && (
              <button
                onClick={() => onDismiss(index)}
                className="text-xs opacity-70 hover:opacity-100 ml-2"
              >
                ✕
              </button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};

export default RealTimeFeedback;

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 1. AlertCard - Display critical alerts with severity levels
 */
export const AlertCard: React.FC<{
  title: string;
  message: string;
  severity: "critical" | "warning" | "info";
  icon?: React.ReactNode;
}> = ({ title, message, severity, icon }) => {
  const severityStyles = {
    critical: "border-red-300 bg-red-50",
    warning: "border-yellow-300 bg-yellow-50",
    info: "border-blue-300 bg-blue-50",
  };

  const textStyles = {
    critical: "text-red-900",
    warning: "text-yellow-900",
    info: "text-blue-900",
  };

  return (
    <div className={cn("p-4 rounded-lg border", severityStyles[severity])}>
      <div className="flex gap-3">
        {icon || <AlertCircle className={cn("w-5 h-5 flex-shrink-0", textStyles[severity])} />}
        <div>
          <h3 className={cn("font-semibold", textStyles[severity])}>{title}</h3>
          <p className={cn("text-sm", textStyles[severity])}>{message}</p>
        </div>
      </div>
    </div>
  );
};

/**
 * 2. MetricCard - Display key metrics with trend indicators
 */
export const MetricCard: React.FC<{
  label: string;
  value: string | number;
  unit?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: number;
  color?: "blue" | "green" | "red" | "orange";
}> = ({ label, value, unit, trend, trendValue, color = "blue" }) => {
  const colorStyles = {
    blue: "text-blue-600",
    green: "text-green-600",
    red: "text-red-600",
    orange: "text-orange-600",
  };

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-600">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-1">
            <span className={cn("text-3xl font-bold", colorStyles[color])}>{value}</span>
            {unit && <span className="text-sm text-gray-500">{unit}</span>}
          </div>
          {TrendIcon && trendValue !== undefined && (
            <div className="flex items-center gap-1 text-sm">
              <TrendIcon className="w-4 h-4" />
              <span>{trendValue}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * 3. ProgressRing - Circular progress indicator
 */
export const ProgressRing: React.FC<{
  percentage: number;
  label?: string;
  size?: "sm" | "md" | "lg";
  color?: string;
}> = ({ percentage, label, size = "md", color = "blue" }) => {
  const sizeMap = { sm: 60, md: 100, lg: 140 };
  const radius = sizeMap[size] / 2 - 5;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width={sizeMap[size]} height={sizeMap[size]} className="transform -rotate-90">
        <circle
          cx={sizeMap[size] / 2}
          cy={sizeMap[size] / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="3"
        />
        <circle
          cx={sizeMap[size] / 2}
          cy={sizeMap[size] / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.3s ease" }}
        />
      </svg>
      <div className="text-center mt-2">
        <div className="text-2xl font-bold">{percentage}%</div>
        {label && <div className="text-sm text-gray-600">{label}</div>}
      </div>
    </div>
  );
};

/**
 * 4. RiskBadge - Display risk level with color coding
 */
export const RiskBadge: React.FC<{
  riskScore: number;
  showLabel?: boolean;
}> = ({ riskScore, showLabel = true }) => {
  const getRiskLevel = (score: number) => {
    if (score > 70) return { level: "CRITICAL", color: "destructive", bgColor: "bg-red-100" };
    if (score > 50) return { level: "HIGH", color: "secondary", bgColor: "bg-orange-100" };
    return { level: "MEDIUM", color: "default", bgColor: "bg-green-100" };
  };

  const { level, color, bgColor } = getRiskLevel(riskScore);

  return (
    <div className="flex items-center gap-2">
      <Badge variant={color as any}>{level}</Badge>
      {showLabel && <span className="text-sm font-semibold">{riskScore}%</span>}
    </div>
  );
};

/**
 * 5. VitalSignsDisplay - Show vital signs in a compact format
 */
export const VitalSignsDisplay: React.FC<{
  heartRate?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  temperature?: number;
  systolicBP?: number;
  diastolicBP?: number;
}> = ({
  heartRate,
  respiratoryRate,
  oxygenSaturation,
  temperature,
  systolicBP,
  diastolicBP,
}) => {
  const vitals = [
    { label: "HR", value: heartRate, unit: "bpm" },
    { label: "RR", value: respiratoryRate, unit: "/min" },
    { label: "O₂", value: oxygenSaturation, unit: "%" },
    { label: "Temp", value: temperature, unit: "°C" },
    { label: "BP", value: systolicBP && diastolicBP ? `${systolicBP}/${diastolicBP}` : undefined, unit: "" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {vitals.map((vital) => (
        <div key={vital.label} className="text-center p-2 bg-gray-50 rounded-lg">
          <p className="text-xs font-medium text-gray-600">{vital.label}</p>
          <p className="text-sm font-semibold">
            {vital.value ?? "—"} <span className="text-xs text-gray-500">{vital.unit}</span>
          </p>
        </div>
      ))}
    </div>
  );
};

/**
 * 6. StatusBadge - Show status with icon
 */
export const StatusBadge: React.FC<{
  status: "active" | "inactive" | "pending" | "completed";
  label?: string;
}> = ({ status, label }) => {
  const statusStyles = {
    active: "bg-green-100 text-green-800 border-green-300",
    inactive: "bg-gray-100 text-gray-800 border-gray-300",
    pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
    completed: "bg-blue-100 text-blue-800 border-blue-300",
  };

  return (
    <Badge className={cn("border", statusStyles[status])}>
      {label || status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

/**
 * 7. StatCard - Display statistics with optional comparison
 */
export const StatCard: React.FC<{
  title: string;
  value: number | string;
  comparison?: { value: number; label: string };
  icon?: React.ReactNode;
}> = ({ title, value, comparison, icon }) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {comparison && (
              <p className="text-xs text-gray-500 mt-2">
                {comparison.label}: {comparison.value}
              </p>
            )}
          </div>
          {icon && <div className="text-gray-400">{icon}</div>}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * 8. PatientCard - Compact patient information display
 */
export const PatientCard: React.FC<{
  name: string;
  age: number;
  diagnosis: string;
  riskScore: number;
  onClick?: () => void;
}> = ({ name, age, diagnosis, riskScore, onClick }) => {
  const { level, bgColor } = riskScore > 70 ? { level: "CRITICAL", bgColor: "bg-red-100" } : riskScore > 50 ? { level: "HIGH", bgColor: "bg-orange-100" } : { level: "MEDIUM", bgColor: "bg-green-100" };

  return (
    <Card
      className={cn("cursor-pointer hover:shadow-lg transition-shadow", bgColor)}
      onClick={onClick}
    >
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold">{name}</h3>
            <p className="text-sm text-gray-600">{age} years • {diagnosis}</p>
          </div>
          <Badge>{level}</Badge>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{riskScore}%</p>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * 9. EmptyState - Show when no data is available
 */
export const EmptyState: React.FC<{
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}> = ({ icon, title, description, action }) => {
  return (
    <div className="text-center py-12">
      {icon && <div className="mb-4 flex justify-center">{icon}</div>}
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-gray-600 mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

/**
 * 10. LoadingSpinner - Show loading state
 */
export const LoadingSpinner: React.FC<{ message?: string }> = ({ message = "Loading..." }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-gray-600">{message}</p>
    </div>
  );
};

/**
 * 11. TimelineItem - Show event timeline
 */
export const TimelineItem: React.FC<{
  title: string;
  description?: string;
  timestamp: Date;
  icon?: React.ReactNode;
}> = ({ title, description, timestamp, icon }) => {
  return (
    <div className="flex gap-4 pb-6 last:pb-0">
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
          {icon || <Activity className="w-5 h-5 text-blue-600" />}
        </div>
        <div className="w-0.5 h-12 bg-gray-200 mt-2 last:hidden"></div>
      </div>
      <div className="pt-1">
        <h4 className="font-semibold">{title}</h4>
        {description && <p className="text-sm text-gray-600">{description}</p>}
        <p className="text-xs text-gray-500 mt-1">{timestamp.toLocaleString()}</p>
      </div>
    </div>
  );
};

/**
 * 12. ComparisonChart - Show comparison between two values
 */
export const ComparisonChart: React.FC<{
  label: string;
  myValue: number;
  peerValue: number;
  unit?: string;
  maxValue?: number;
}> = ({ label, myValue, peerValue, unit = "", maxValue = 100 }) => {
  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-sm">{label}</h4>
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-xs font-medium">Your Value</span>
          <span className="text-xs font-semibold">{myValue}{unit}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full"
            style={{ width: `${(myValue / maxValue) * 100}%` }}
          ></div>
        </div>
      </div>
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-xs font-medium">Peer Average</span>
          <span className="text-xs font-semibold">{peerValue}{unit}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gray-400 h-2 rounded-full"
            style={{ width: `${(peerValue / maxValue) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

/**
 * 13. ActionButtons - Common action button group
 */
export const ActionButtons: React.FC<{
  actions: Array<{ label: string; onClick: () => void; variant?: "default" | "outline" | "destructive" }>;
}> = ({ actions }) => {
  return (
    <div className="flex gap-2 flex-wrap">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={action.onClick}
          className={cn(
            "px-4 py-2 rounded-lg font-medium transition-colors",
            action.variant === "destructive"
              ? "bg-red-600 text-white hover:bg-red-700"
              : action.variant === "outline"
              ? "border border-gray-300 hover:bg-gray-50"
              : "bg-blue-600 text-white hover:bg-blue-700"
          )}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
};

/**
 * 14. InfoBox - Display information with icon
 */
export const InfoBox: React.FC<{
  title: string;
  content: string;
  icon?: React.ReactNode;
  type?: "info" | "success" | "warning" | "error";
}> = ({ title, content, icon, type = "info" }) => {
  const typeStyles = {
    info: "bg-blue-50 border-blue-200 text-blue-900",
    success: "bg-green-50 border-green-200 text-green-900",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-900",
    error: "bg-red-50 border-red-200 text-red-900",
  };

  return (
    <div className={cn("p-4 rounded-lg border", typeStyles[type])}>
      <div className="flex gap-3">
        {icon && <div className="flex-shrink-0">{icon}</div>}
        <div>
          <h4 className="font-semibold text-sm">{title}</h4>
          <p className="text-sm mt-1">{content}</p>
        </div>
      </div>
    </div>
  );
};

/**
 * 15. FeatureCard - Display feature with description
 */
export const FeatureCard: React.FC<{
  title: string;
  description: string;
  icon?: React.ReactNode;
  badge?: string;
  onClick?: () => void;
}> = ({ title, description, icon, badge, onClick }) => {
  return (
    <Card
      className={cn("hover:shadow-lg transition-shadow", onClick && "cursor-pointer")}
      onClick={onClick}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3">
            {icon && <div className="text-blue-600 flex-shrink-0">{icon}</div>}
            <div>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            </div>
          </div>
          {badge && <Badge>{badge}</Badge>}
        </div>
      </CardContent>
    </Card>
  );
};

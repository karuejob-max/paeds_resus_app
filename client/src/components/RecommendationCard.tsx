import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Lightbulb, ArrowRight } from "lucide-react";

export interface Recommendation {
  id: string;
  title: string;
  content: string;
  actionUrl?: string;
  priority: "low" | "medium" | "high";
  actionable: boolean;
  category?: string;
  completed?: boolean;
}

interface RecommendationCardProps {
  recommendation: Recommendation;
  onAction?: (recommendation: Recommendation) => void;
  onDismiss?: (id: string) => void;
}

export default function RecommendationCard({
  recommendation,
  onAction,
  onDismiss,
}: RecommendationCardProps) {
  const priorityColors = {
    low: "bg-blue-100 text-blue-800 border-blue-300",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
    high: "bg-red-100 text-red-800 border-red-300",
  };

  const priorityIcons = {
    low: <Lightbulb className="w-4 h-4" />,
    medium: <AlertCircle className="w-4 h-4" />,
    high: <AlertCircle className="w-4 h-4" />,
  };

  return (
    <Card
      className={`relative overflow-hidden transition-all ${
        recommendation.completed ? "opacity-75 bg-gray-50" : ""
      }`}
    >
      {/* Priority indicator bar */}
      <div
        className={`absolute top-0 left-0 h-1 w-full ${
          recommendation.priority === "high"
            ? "bg-red-500"
            : recommendation.priority === "medium"
              ? "bg-yellow-500"
              : "bg-blue-500"
        }`}
      />

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {recommendation.completed ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                priorityIcons[recommendation.priority]
              )}
              <CardTitle className="text-lg">{recommendation.title}</CardTitle>
            </div>
            {recommendation.category && (
              <CardDescription className="text-xs">
                {recommendation.category}
              </CardDescription>
            )}
          </div>
          <Badge
            variant="outline"
            className={`${priorityColors[recommendation.priority]} flex-shrink-0`}
          >
            {recommendation.priority === "high"
              ? "Critical"
              : recommendation.priority === "medium"
                ? "Important"
                : "Helpful"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-gray-700 leading-relaxed">
          {recommendation.content}
        </p>

        <div className="flex gap-2">
          {recommendation.actionable && recommendation.actionUrl && (
            <Button
              onClick={() => onAction?.(recommendation)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              Take Action <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}

          {onDismiss && !recommendation.completed && (
            <Button
              onClick={() => onDismiss(recommendation.id)}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              Dismiss
            </Button>
          )}

          {recommendation.completed && (
            <div className="flex-1 flex items-center justify-center text-green-600 text-sm font-medium">
              ✓ Completed
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

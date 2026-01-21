import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, TrendingUp, CheckCircle2, X } from "lucide-react";
import RecommendationCard, { Recommendation } from "./RecommendationCard";

interface RecommendationsPanelProps {
  recommendations?: Recommendation[];
  isLoading?: boolean;
  onViewMore?: () => void;
}

export default function RecommendationsPanel({
  recommendations = [],
  isLoading = false,
  onViewMore,
}: RecommendationsPanelProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("all");

  const filteredRecommendations = recommendations.filter(
    (rec) => !dismissedIds.has(rec.id)
  );

  const highPriority = filteredRecommendations.filter((r) => r.priority === "high");
  const mediumPriority = filteredRecommendations.filter((r) => r.priority === "medium");
  const lowPriority = filteredRecommendations.filter((r) => r.priority === "low");
  const completed = filteredRecommendations.filter((r) => r.completed);

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => {
      const newSet = new Set(prev);
      newSet.add(id);
      return newSet;
    });
  };

  const handleAction = (recommendation: Recommendation) => {
    if (recommendation.actionUrl) {
      window.location.href = recommendation.actionUrl;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-600" />
            Personalized Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (filteredRecommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Personalized Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              No recommendations at this time. Keep logging events to get personalized insights!
            </p>
            <Button variant="outline" onClick={onViewMore}>
              View All Events
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
              Personalized Recommendations
            </CardTitle>
            <CardDescription>
              Based on your Safe-Truth events and system gaps identified
            </CardDescription>
          </div>
          <Badge variant="secondary">
            {filteredRecommendations.length} active
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" className="relative">
              All
              {filteredRecommendations.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {filteredRecommendations.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="high" className="relative">
              Critical
              {highPriority.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {highPriority.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="medium" className="relative">
              Important
              {mediumPriority.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-yellow-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {mediumPriority.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" className="relative">
              Done
              {completed.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-green-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {completed.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3 mt-4">
            {filteredRecommendations.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No recommendations to display
              </p>
            ) : (
              filteredRecommendations.map((rec) => (
                <RecommendationCard
                  key={rec.id}
                  recommendation={rec}
                  onAction={handleAction}
                  onDismiss={handleDismiss}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="high" className="space-y-3 mt-4">
            {highPriority.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No critical recommendations
              </p>
            ) : (
              highPriority.map((rec) => (
                <RecommendationCard
                  key={rec.id}
                  recommendation={rec}
                  onAction={handleAction}
                  onDismiss={handleDismiss}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="medium" className="space-y-3 mt-4">
            {mediumPriority.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No important recommendations
              </p>
            ) : (
              mediumPriority.map((rec) => (
                <RecommendationCard
                  key={rec.id}
                  recommendation={rec}
                  onAction={handleAction}
                  onDismiss={handleDismiss}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-3 mt-4">
            {completed.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No completed recommendations yet
              </p>
            ) : (
              completed.map((rec) => (
                <RecommendationCard
                  key={rec.id}
                  recommendation={rec}
                  onAction={handleAction}
                  onDismiss={handleDismiss}
                />
              ))
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-4 pt-4 border-t">
          <Button
            variant="outline"
            className="w-full"
            onClick={onViewMore}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            View All Recommendations & Progress
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

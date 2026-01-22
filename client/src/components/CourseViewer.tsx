import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, ChevronRight, Loader2 } from "lucide-react";

interface Module {
  id: number;
  title: string;
  description: string;
  content: string;
  duration: number;
  order: number;
}

interface CourseViewerProps {
  modules: Module[];
  isLoading?: boolean;
  onModuleComplete?: (moduleId: number) => void;
}

export default function CourseViewer({
  modules,
  isLoading = false,
  onModuleComplete,
}: CourseViewerProps) {
  const [activeModule, setActiveModule] = useState<number | null>(modules[0]?.id || null);
  const [completedModules, setCompletedModules] = useState<Set<number>>(new Set());

  const currentModule = modules.find((m) => m.id === activeModule);
  const progress = (completedModules.size / modules.length) * 100;

  const handleCompleteModule = () => {
    if (activeModule) {
      setCompletedModules((prev) => new Set(Array.from(prev).concat(activeModule)));
      onModuleComplete?.(activeModule);

      // Move to next module
      const currentIndex = modules.findIndex((m) => m.id === activeModule);
      if (currentIndex < modules.length - 1) {
        setActiveModule(modules[currentIndex + 1].id);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-4 gap-6">
      {/* Module List */}
      <div className="md:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Course Modules</CardTitle>
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm text-slate-600">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {modules.map((module) => (
              <button
                key={module.id}
                onClick={() => setActiveModule(module.id)}
                className={`w-full text-left p-3 rounded-lg transition-all ${
                  activeModule === module.id
                    ? "bg-blue-100 border-2 border-blue-600"
                    : "bg-slate-50 border-2 border-transparent hover:bg-slate-100"
                }`}
              >
                <div className="flex items-start gap-2">
                  {completedModules.has(module.id) ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{module.title}</p>
                    <p className="text-xs text-slate-600 flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      {module.duration} min
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Module Content */}
      <div className="md:col-span-3">
        {currentModule ? (
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Badge className="mb-2">{`Module ${currentModule.order}`}</Badge>
                  <CardTitle>{currentModule.title}</CardTitle>
                  <p className="text-sm text-slate-600 mt-2">{currentModule.description}</p>
                </div>
                {completedModules.has(currentModule.id) && (
                  <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Module Content */}
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: currentModule.content }}
              />

              {/* Navigation */}
              <div className="flex gap-3 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    const currentIndex = modules.findIndex((m) => m.id === activeModule);
                    if (currentIndex > 0) {
                      setActiveModule(modules[currentIndex - 1].id);
                    }
                  }}
                  disabled={modules.findIndex((m) => m.id === activeModule) === 0}
                >
                  Previous
                </Button>
                <Button
                  onClick={handleCompleteModule}
                  disabled={completedModules.has(currentModule.id)}
                  className="flex-1"
                >
                  {completedModules.has(currentModule.id) ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Completed
                    </>
                  ) : (
                    <>
                      Mark as Complete
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-slate-600">No modules available</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

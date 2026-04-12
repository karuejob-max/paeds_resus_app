import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface TourStep {
  element: string;
  intro: string;
  position?: "top" | "bottom" | "left" | "right" | "center";
}

const PROVIDER_TOUR_STEPS: TourStep[] = [
  {
    element: ".feature-discovery-dashboard",
    intro: "Welcome! This dashboard shows all the features available to you. Let's take a quick tour.",
    position: "bottom",
  },
  {
    element: ".quick-start-guide",
    intro: "Follow these 4 quick steps to get started with ResusGPS, courses, and Care Signal.",
    position: "bottom",
  },
  {
    element: ".courses-nav-link",
    intro: "Browse and enroll in micro-courses to start your Paeds Resus Fellowship.",
    position: "bottom",
  },
  {
    element: ".resus-gps-link",
    intro: "Access ResusGPS for real-time clinical guidance at the bedside.",
    position: "bottom",
  },
  {
    element: ".care-signal-link",
    intro: "Set up Care Signal to receive real-time clinical alerts for your facility.",
    position: "bottom",
  },
  {
    element: ".fellowship-link",
    intro: "Track your Fellowship progress and view completed courses here.",
    position: "bottom",
  },
  {
    element: ".install-app-button",
    intro: "Install the app on your device for offline access and faster performance.",
    position: "left",
  },
];

const PARENT_TOUR_STEPS: TourStep[] = [
  {
    element: ".feature-discovery-dashboard",
    intro: "Welcome! Here are the resources available for parents and caregivers.",
    position: "bottom",
  },
  {
    element: ".quick-start-guide",
    intro: "Follow these 3 steps to learn pediatric first aid and safety.",
    position: "bottom",
  },
  {
    element: ".courses-nav-link",
    intro: "Enroll in family-friendly first aid courses.",
    position: "bottom",
  },
  {
    element: ".parent-safe-truth-link",
    intro: "Access safety guides and resources for child emergencies.",
    position: "bottom",
  },
  {
    element: ".install-app-button",
    intro: "Install the app to have emergency guidance always available.",
    position: "left",
  },
];

const INSTITUTION_TOUR_STEPS: TourStep[] = [
  {
    element: ".feature-discovery-dashboard",
    intro: "Welcome! Here's how to set up and manage training for your institution.",
    position: "bottom",
  },
  {
    element: ".quick-start-guide",
    intro: "Follow these 4 steps to register your team and assign courses.",
    position: "bottom",
  },
  {
    element: ".hospital-admin-dashboard-link",
    intro: "Manage your team members and course assignments.",
    position: "bottom",
  },
  {
    element: ".admin-courses-link",
    intro: "Create and customize training pathways for your staff.",
    position: "bottom",
  },
  {
    element: ".analytics-link",
    intro: "Monitor completion rates and track outcomes.",
    position: "bottom",
  },
  {
    element: ".care-signal-analytics-link",
    intro: "Set up facility-wide clinical alerts.",
    position: "bottom",
  },
];

export function FeatureTour() {
  const { user } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    // Check if user has completed tour before
    const hasCompletedTour = localStorage.getItem(`tour-completed-${user.id}`);
    if (!hasCompletedTour) {
      setShowPrompt(true);
    }
  }, [user?.id]);

  const getTourSteps = () => {
    if (user?.role === "parent") return PARENT_TOUR_STEPS;
    if (user?.role === "institution") return INSTITUTION_TOUR_STEPS;
    return PROVIDER_TOUR_STEPS;
  };

  const steps = getTourSteps();
  const step = steps[currentStep];

  const startTour = () => {
    setIsRunning(true);
    setShowPrompt(false);
    setCurrentStep(0);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTour = () => {
    if (user?.id) {
      localStorage.setItem(`tour-completed-${user.id}`, "true");
    }
    setIsRunning(false);
    setShowPrompt(false);
  };

  if (!showPrompt && !isRunning) return null;

  // Show prompt to start tour
  if (showPrompt && !isRunning) {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-xs">
        <div className="bg-primary text-primary-foreground rounded-lg shadow-lg p-4 space-y-3 border border-primary/20">
          <div>
            <h3 className="font-semibold text-sm">New to PaedsResus?</h3>
            <p className="text-xs opacity-90 mt-1">
              Take a quick tour to learn about all available features.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => completeTour()}
            >
              Skip
            </Button>
            <Button size="sm" onClick={startTour}>
              Start Tour
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show tour step
  if (isRunning && step) {
    const element = document.querySelector(step.element);
    if (!element) {
      return null;
    }

    const rect = element.getBoundingClientRect();
    const scrollTop = window.scrollY;
    const scrollLeft = window.scrollX;

    let tooltipTop = rect.top + scrollTop;
    let tooltipLeft = rect.left + scrollLeft;

    // Position tooltip based on preference
    if (step.position === "bottom") {
      tooltipTop += rect.height + 16;
      tooltipLeft += rect.width / 2;
    } else if (step.position === "top") {
      tooltipTop -= 16;
      tooltipLeft += rect.width / 2;
    } else if (step.position === "left") {
      tooltipTop += rect.height / 2;
      tooltipLeft -= 16;
    } else if (step.position === "right") {
      tooltipTop += rect.height / 2;
      tooltipLeft += rect.width + 16;
    }

    return (
      <>
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={completeTour}
          style={{ pointerEvents: "auto" }}
        />

        {/* Highlight */}
        <div
          className="fixed border-2 border-primary rounded-lg z-40 pointer-events-none"
          style={{
            top: rect.top + scrollTop - 4,
            left: rect.left + scrollLeft - 4,
            width: rect.width + 8,
            height: rect.height + 8,
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
          }}
        />

        {/* Tooltip */}
        <div
          className="fixed z-50 bg-white text-foreground rounded-lg shadow-2xl p-4 max-w-xs border border-border"
          style={{
            top: `${tooltipTop}px`,
            left: `${tooltipLeft}px`,
            transform:
              step.position === "bottom" || step.position === "top"
                ? "translateX(-50%)"
                : step.position === "left"
                  ? "translateX(-100%)"
                  : "translateX(0)",
          }}
        >
          <div className="space-y-3">
            <div className="flex justify-between items-start gap-2">
              <p className="text-sm font-medium flex-1">{step.intro}</p>
              <button
                onClick={completeTour}
                className="text-muted-foreground hover:text-foreground transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-between items-center gap-2">
              <div className="text-xs text-muted-foreground">
                {currentStep + 1} / {steps.length}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={nextStep}
                >
                  {currentStep === steps.length - 1 ? (
                    "Done"
                  ) : (
                    <>
                      Next <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return null;
}

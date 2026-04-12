import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

interface TourStep {
  element: string;
  intro: string;
  position?: "top" | "bottom" | "left" | "right" | "center";
  highlightClass?: string;
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
  const [showTour, setShowTour] = useState(false);
  const [tourStarted, setTourStarted] = useState(false);
  const tourRef = useRef<any>(null);

  useEffect(() => {
    // Check if user has completed tour before
    const hasCompletedTour = localStorage.getItem(`tour-completed-${user?.id}`);
    if (!hasCompletedTour && !tourStarted) {
      setShowTour(true);
    }
  }, [user?.id, tourStarted]);

  const startTour = async () => {
    try {
      // Dynamically import intro.js only when needed
      const introJs = (await import("intro.js")).default;

      let steps = PROVIDER_TOUR_STEPS;
      if (user?.role === "parent") {
        steps = PARENT_TOUR_STEPS;
      } else if (user?.role === "institution") {
        steps = INSTITUTION_TOUR_STEPS;
      }

      const intro = introJs();
      intro.setOptions({
        steps: steps.map((step) => ({
          element: step.element,
          intro: step.intro,
          position: step.position || "bottom",
        })),
        showProgress: true,
        showBullets: true,
        exitOnEsc: true,
        exitOnOverlayClick: true,
        overlayOpacity: 0.5,
        disableInteraction: false,
        nextLabel: "Next →",
        prevLabel: "← Back",
        skipLabel: "Skip",
        doneLabel: "Done",
      });

      intro.onbeforechange(() => {
        // Scroll element into view
        const element = document.querySelector(steps[intro._currentStep]?.element || "");
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });

      intro.oncomplete(() => {
        localStorage.setItem(`tour-completed-${user?.id}`, "true");
        setShowTour(false);
      });

      intro.onexit(() => {
        localStorage.setItem(`tour-completed-${user?.id}`, "true");
        setShowTour(false);
      });

      intro.start();
      tourRef.current = intro;
      setTourStarted(true);
    } catch (error) {
      console.error("Failed to load tour:", error);
    }
  };

  if (!showTour) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-xs">
      <div className="bg-primary text-primary-foreground rounded-lg shadow-lg p-4 space-y-3">
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
            onClick={() => {
              localStorage.setItem(`tour-completed-${user?.id}`, "true");
              setShowTour(false);
            }}
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

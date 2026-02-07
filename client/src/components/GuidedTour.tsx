/**
 * Guided Tour
 * 
 * 5-step interactive tour for first-time users showing key features.
 * Highlights interventions sidebar, handover generation, collaborative sessions,
 * advanced modules, and offline capability.
 */

import { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TourStep {
  title: string;
  description: string;
  target?: string; // CSS selector for element to highlight
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const tourSteps: TourStep[] = [
  {
    title: 'Welcome to ResusGPS!',
    description: 'Let\'s take a quick tour of the features that will help you save lives faster. This will only take 30 seconds.',
    position: 'center',
  },
  {
    title: 'Interventions Sidebar',
    description: 'All active treatments track here. Assessment never stops - just like real emergencies. Click any intervention to see details or mark complete.',
    target: '[data-tour="interventions-sidebar"]',
    position: 'left',
  },
  {
    title: 'Generate SBAR Handover',
    description: 'Click here anytime to generate complete SBAR handover - Situation, Background, Assessment, Recommendation. Perfect for shift changes or specialist consults.',
    target: '[data-tour="handover-button"]',
    position: 'bottom',
  },
  {
    title: 'Collaborative Sessions',
    description: 'Start a team session - everyone sees live updates as you assess. Perfect for teaching or complex cases requiring multiple providers.',
    target: '[data-tour="collaborate-button"]',
    position: 'bottom',
  },
  {
    title: 'You\'re Ready!',
    description: 'Advanced modules (shock, asthma, DKA) appear automatically when needed. Install the app to work offline. Now go save lives.',
    position: 'center',
  },
];

interface GuidedTourProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function GuidedTour({ onComplete, onSkip }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);

  const step = tourSteps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === tourSteps.length - 1;

  // Highlight target element
  useEffect(() => {
    if (step.target) {
      const element = document.querySelector(step.target) as HTMLElement;
      setHighlightedElement(element);
      
      // Scroll element into view
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      setHighlightedElement(null);
    }
  }, [step.target]);

  const handleNext = () => {
    if (isLast) {
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirst) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Get position for tooltip based on highlighted element
  const getTooltipPosition = () => {
    if (!highlightedElement || step.position === 'center') {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const rect = highlightedElement.getBoundingClientRect();
    const positions = {
      top: {
        top: `${rect.top - 20}px`,
        left: `${rect.left + rect.width / 2}px`,
        transform: 'translate(-50%, -100%)',
      },
      bottom: {
        top: `${rect.bottom + 20}px`,
        left: `${rect.left + rect.width / 2}px`,
        transform: 'translate(-50%, 0)',
      },
      left: {
        top: `${rect.top + rect.height / 2}px`,
        left: `${rect.left - 20}px`,
        transform: 'translate(-100%, -50%)',
      },
      right: {
        top: `${rect.top + rect.height / 2}px`,
        left: `${rect.right + 20}px`,
        transform: 'translate(0, -50%)',
      },
    };

    return positions[step.position] || positions.bottom;
  };

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Overlay with spotlight effect */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm">
        {highlightedElement && (
          <div
            className="absolute border-4 border-cyan-500 rounded-lg pointer-events-none transition-all duration-300"
            style={{
              top: `${highlightedElement.getBoundingClientRect().top - 8}px`,
              left: `${highlightedElement.getBoundingClientRect().left - 8}px`,
              width: `${highlightedElement.getBoundingClientRect().width + 16}px`,
              height: `${highlightedElement.getBoundingClientRect().height + 16}px`,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.8)',
            }}
          />
        )}
      </div>

      {/* Tooltip */}
      <div
        className="absolute bg-gray-900 border-2 border-cyan-500 rounded-lg p-6 max-w-md shadow-2xl transition-all duration-300"
        style={getTooltipPosition()}
      >
        {/* Close button */}
        <button
          onClick={onSkip}
          className="absolute top-2 right-2 text-gray-400 hover:text-white"
          aria-label="Skip tour"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
          <p className="text-gray-300 text-sm">{step.description}</p>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {tourSteps.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all ${
                idx === currentStep
                  ? 'w-8 bg-cyan-500'
                  : idx < currentStep
                  ? 'w-2 bg-green-500'
                  : 'w-2 bg-gray-600'
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            onClick={handlePrevious}
            disabled={isFirst}
            variant="outline"
            size="sm"
            className="border-gray-600 text-gray-300 hover:text-white disabled:opacity-30"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          <span className="text-sm text-gray-400">
            {currentStep + 1} of {tourSteps.length}
          </span>

          <Button
            onClick={handleNext}
            size="sm"
            className={isLast ? 'bg-green-600 hover:bg-green-700' : 'bg-cyan-500 hover:bg-cyan-600'}
          >
            {isLast ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                Got It!
              </>
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>

        {/* Skip option */}
        <div className="text-center mt-4">
          <button
            onClick={onSkip}
            className="text-sm text-gray-500 hover:text-gray-400 underline"
          >
            Skip tour
          </button>
        </div>
      </div>
    </div>
  );
}

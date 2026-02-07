/**
 * Feature Spotlight Carousel
 * 
 * Rotating carousel on homepage showcasing ResusGPS capabilities.
 * Helps providers discover hidden features like collaborative sessions,
 * SBAR handover, voice commands, and offline mode.
 */

import { useState, useEffect } from 'react';
import { Users, FileText, Mic, Wifi, Zap, Heart, Activity, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: string;
  color: string;
}

const features: Feature[] = [
  {
    icon: <Users className="h-6 w-6" />,
    title: 'Work Together',
    description: 'Start collaborative sessions - your team sees live updates as you assess',
    action: 'Learn More',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: <FileText className="h-6 w-6" />,
    title: 'Hand Over Safely',
    description: 'Generate SBAR handover instantly - complete situation, background, assessment, recommendation',
    action: 'Try It',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: <Mic className="h-6 w-6" />,
    title: 'Speak Hands-Free',
    description: 'Voice commands let you input data without removing gloves or touching screen',
    action: 'Activate Voice',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: <Wifi className="h-6 w-6" />,
    title: 'Work Offline',
    description: 'Install the app - full functionality without internet for remote/disaster settings',
    action: 'Install App',
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: 'Advanced Modules',
    description: 'Shock, asthma, DKA protocols appear automatically when assessment triggers them',
    action: 'See All',
    color: 'from-yellow-500 to-amber-500',
  },
  {
    icon: <Activity className="h-6 w-6" />,
    title: 'Non-Blocking Flow',
    description: 'Interventions track in sidebar - assessment never stops, just like real emergencies',
    action: 'How It Works',
    color: 'from-teal-500 to-cyan-500',
  },
];

export function FeatureSpotlight() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-advance every 5 seconds
  useEffect(() => {
    if (isPaused) return;
    
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % features.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [isPaused]);

  const current = features[currentIndex];

  return (
    <div 
      className="relative bg-gray-800/50 border border-gray-700 rounded-lg p-6 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-r ${current.color} opacity-5`} />

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`h-12 w-12 rounded-full bg-gradient-to-r ${current.color} flex items-center justify-center flex-shrink-0 text-white`}>
            {current.icon}
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-white">{current.title}</h3>
              <span className="text-xs text-gray-400">
                {currentIndex + 1}/{features.length}
              </span>
            </div>
            <p className="text-sm text-gray-300 mb-3">{current.description}</p>
            
            {current.action && (
              <Button
                variant="ghost"
                size="sm"
                className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 px-0"
              >
                {current.action} →
              </Button>
            )}
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {features.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === currentIndex
                  ? 'w-8 bg-cyan-500'
                  : 'w-2 bg-gray-600 hover:bg-gray-500'
              }`}
              aria-label={`Go to feature ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Pause indicator */}
      {isPaused && (
        <div className="absolute top-2 right-2 text-xs text-gray-500">
          Paused
        </div>
      )}
    </div>
  );
}

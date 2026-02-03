/**
 * Shout for Help Button
 * 
 * Prominent emergency button for activating crash cart and Emergency Response Team.
 * Placed before assessment starts - when provider recognizes child "looks bad".
 */

import { AlertTriangle, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { triggerHaptic } from '@/lib/haptics';
import { useState } from 'react';

interface ShoutForHelpProps {
  variant?: 'homepage' | 'persistent';
  className?: string;
}

export function ShoutForHelp({ variant = 'homepage', className = '' }: ShoutForHelpProps) {
  const [activated, setActivated] = useState(false);

  const handleShoutForHelp = () => {
    triggerHaptic('critical');
    setActivated(true);
    
    // Voice announcement
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('Help activated. Emergency response team notified.');
      utterance.rate = 1.2;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }

    // Reset after 3 seconds
    setTimeout(() => setActivated(false), 3000);
  };

  if (variant === 'persistent') {
    // Small floating button for modules
    return (
      <Button
        onClick={handleShoutForHelp}
        className={`fixed bottom-4 left-4 z-40 ${
          activated
            ? 'bg-green-600 hover:bg-green-700'
            : 'bg-red-600 hover:bg-red-700 animate-pulse'
        } text-white shadow-lg ${className}`}
        size="lg"
      >
        <Phone className="h-5 w-5 mr-2" />
        {activated ? 'Help Activated' : 'SHOUT FOR HELP'}
      </Button>
    );
  }

  // Large homepage button
  return (
    <Button
      onClick={handleShoutForHelp}
      className={`w-full ${
        activated
          ? 'bg-green-600 hover:bg-green-700'
          : 'bg-red-700 hover:bg-red-800 animate-pulse'
      } text-white text-xl py-8 h-auto shadow-xl ${className}`}
      size="lg"
    >
      <AlertTriangle className="h-8 w-8 mr-3" />
      {activated ? '✓ HELP ACTIVATED' : 'SHOUT FOR HELP'}
      {!activated && (
        <span className="block text-sm mt-1 opacity-90">
          Activate crash cart & emergency team
        </span>
      )}
    </Button>
  );
}

/**
 * Feature Tooltip
 * 
 * Contextual tooltip that appears on hover/long-press to explain
 * what a button/feature does. Makes hidden capabilities discoverable.
 */

import { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

interface FeatureTooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export function FeatureTooltip({ 
  content, 
  children, 
  position = 'top',
  delay = 500 
}: FeatureTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const longPressRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setIsMobile('ontouchstart' in window);
  }, []);

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
    }
    setIsVisible(false);
  };

  const handleTouchStart = () => {
    longPressRef.current = setTimeout(() => {
      setIsVisible(true);
    }, 500); // Long press = 500ms
  };

  const handleTouchEnd = () => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
    }
    // Keep tooltip visible for 3s on mobile
    setTimeout(() => {
      setIsVisible(false);
    }, 3000);
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-900 border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-900 border-y-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-900 border-y-transparent border-l-transparent',
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={!isMobile ? showTooltip : undefined}
      onMouseLeave={!isMobile ? hideTooltip : undefined}
      onTouchStart={isMobile ? handleTouchStart : undefined}
      onTouchEnd={isMobile ? handleTouchEnd : undefined}
    >
      {children}

      {isVisible && (
        <div 
          className={`absolute z-50 ${positionClasses[position]} pointer-events-none`}
          role="tooltip"
        >
          <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-xl border border-gray-700 max-w-xs whitespace-normal">
            {content}
            {/* Arrow */}
            <div className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`} />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Feature Hint Badge
 * 
 * Small info icon that shows tooltip on hover/tap.
 * Use next to buttons to indicate additional info is available.
 */
export function FeatureHint({ content }: { content: string }) {
  return (
    <FeatureTooltip content={content}>
      <button 
        className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
        aria-label="More information"
      >
        <Info className="h-3 w-3" />
      </button>
    </FeatureTooltip>
  );
}

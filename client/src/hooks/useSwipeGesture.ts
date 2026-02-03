/**
 * useSwipeGesture Hook
 * 
 * Detects swipe gestures on touch devices for mobile UX optimization.
 * Supports left, right, up, and down swipes with configurable thresholds.
 */

import { useEffect, useRef } from 'react';

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  minSwipeDistance?: number;  // Minimum distance in pixels to trigger swipe (default: 50)
  maxSwipeTime?: number;      // Maximum time in ms for swipe (default: 300)
  preventDefaultTouchMove?: boolean; // Prevent default touch move behavior
}

interface TouchPosition {
  x: number;
  y: number;
  time: number;
}

export function useSwipeGesture(options: SwipeGestureOptions) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    minSwipeDistance = 50,
    maxSwipeTime = 300,
    preventDefaultTouchMove = false,
  } = options;

  const touchStart = useRef<TouchPosition | null>(null);
  const touchEnd = useRef<TouchPosition | null>(null);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStart.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
      touchEnd.current = null;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (preventDefaultTouchMove && touchStart.current) {
        // Only prevent default if we're potentially swiping
        const touch = e.touches[0];
        const deltaX = Math.abs(touch.clientX - touchStart.current.x);
        const deltaY = Math.abs(touch.clientY - touchStart.current.y);
        
        // If horizontal swipe is more prominent, prevent default
        if (deltaX > deltaY && deltaX > 10) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStart.current) return;

      const touch = e.changedTouches[0];
      touchEnd.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };

      const deltaX = touchEnd.current.x - touchStart.current.x;
      const deltaY = touchEnd.current.y - touchStart.current.y;
      const deltaTime = touchEnd.current.time - touchStart.current.time;

      // Check if swipe was fast enough
      if (deltaTime > maxSwipeTime) {
        touchStart.current = null;
        return;
      }

      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      // Determine swipe direction (horizontal vs vertical)
      if (absDeltaX > absDeltaY) {
        // Horizontal swipe
        if (absDeltaX >= minSwipeDistance) {
          if (deltaX > 0) {
            onSwipeRight?.();
          } else {
            onSwipeLeft?.();
          }
        }
      } else {
        // Vertical swipe
        if (absDeltaY >= minSwipeDistance) {
          if (deltaY > 0) {
            onSwipeDown?.();
          } else {
            onSwipeUp?.();
          }
        }
      }

      touchStart.current = null;
    };

    // Add event listeners
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: !preventDefaultTouchMove });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Cleanup
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, minSwipeDistance, maxSwipeTime, preventDefaultTouchMove]);
}

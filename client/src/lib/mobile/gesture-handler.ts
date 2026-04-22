/**
 * Mobile Gesture Handler for One-Handed Operation
 * 
 * Implements swipe gestures for navigation and panel management
 */

export interface GestureConfig {
  threshold: number; // Minimum swipe distance
  timeThreshold: number; // Maximum time for swipe
  preventDefault: boolean;
}

export interface GestureEvent {
  type: 'swipe-left' | 'swipe-right' | 'swipe-up' | 'swipe-down';
  distance: number;
  duration: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export class GestureHandler {
  private startX: number = 0;
  private startY: number = 0;
  private startTime: number = 0;
  private element: HTMLElement;
  private config: GestureConfig;
  private listeners: Array<(event: GestureEvent) => void> = [];

  constructor(element: HTMLElement, config?: Partial<GestureConfig>) {
    this.element = element;
    this.config = {
      threshold: 50,
      timeThreshold: 300,
      preventDefault: true,
      ...config,
    };

    this.attachListeners();
  }

  private attachListeners(): void {
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), false);
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), false);
  }

  private handleTouchStart(event: TouchEvent): void {
    this.startX = event.touches[0].clientX;
    this.startY = event.touches[0].clientY;
    this.startTime = Date.now();
  }

  private handleTouchEnd(event: TouchEvent): void {
    const endX = event.changedTouches[0].clientX;
    const endY = event.changedTouches[0].clientY;
    const duration = Date.now() - this.startTime;

    // Check if swipe is valid
    if (duration > this.config.timeThreshold) {
      return;
    }

    const deltaX = endX - this.startX;
    const deltaY = endY - this.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance < this.config.threshold) {
      return;
    }

    // Determine swipe direction
    const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);

    let gestureEvent: GestureEvent | null = null;

    if (isHorizontal) {
      if (deltaX > 0) {
        gestureEvent = {
          type: 'swipe-right',
          distance,
          duration,
          startX: this.startX,
          startY: this.startY,
          endX,
          endY,
        };
      } else {
        gestureEvent = {
          type: 'swipe-left',
          distance,
          duration,
          startX: this.startX,
          startY: this.startY,
          endX,
          endY,
        };
      }
    } else {
      if (deltaY > 0) {
        gestureEvent = {
          type: 'swipe-down',
          distance,
          duration,
          startX: this.startX,
          startY: this.startY,
          endX,
          endY,
        };
      } else {
        gestureEvent = {
          type: 'swipe-up',
          distance,
          duration,
          startX: this.startX,
          startY: this.startY,
          endX,
          endY,
        };
      }
    }

    if (this.config.preventDefault) {
      event.preventDefault();
    }

    // Notify listeners
    this.listeners.forEach(listener => listener(gestureEvent));
  }

  public on(listener: (event: GestureEvent) => void): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public destroy(): void {
    this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    this.listeners = [];
  }
}

/**
 * React hook for gesture handling
 */
export function useGestureHandler(
  ref: React.RefObject<HTMLElement>,
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  onSwipeUp?: () => void,
  onSwipeDown?: () => void,
  config?: Partial<GestureConfig>
) {
  React.useEffect(() => {
    if (!ref.current) return;

    const handler = new GestureHandler(ref.current, config);

    const unsubscribe = handler.on((event) => {
      switch (event.type) {
        case 'swipe-left':
          onSwipeLeft?.();
          break;
        case 'swipe-right':
          onSwipeRight?.();
          break;
        case 'swipe-up':
          onSwipeUp?.();
          break;
        case 'swipe-down':
          onSwipeDown?.();
          break;
      }
    });

    return () => {
      unsubscribe();
      handler.destroy();
    };
  }, [ref, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, config]);
}

/**
 * Utility to check if device is mobile
 */
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Utility to get viewport dimensions
 */
export function getViewportDimensions() {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    isPortrait: window.innerHeight > window.innerWidth,
    isLandscape: window.innerWidth > window.innerHeight,
  };
}

/**
 * Utility to optimize touch target size
 */
export const TOUCH_TARGET_SIZE = 44; // Minimum 44x44 for accessibility

/**
 * Utility to check if element is in viewport
 */
export function isElementInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Utility to scroll element into view
 */
export function scrollIntoView(element: HTMLElement, smooth: boolean = true): void {
  element.scrollIntoView({
    behavior: smooth ? 'smooth' : 'auto',
    block: 'center',
    inline: 'center',
  });
}

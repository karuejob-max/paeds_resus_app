/** @vitest-environment jsdom */
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useCprFeedback } from './useCprFeedback';

describe('useCprFeedback', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('requires an explicit unlock before speaking and deduplicates keyed alerts', async () => {
    const speak = vi.fn();
    const cancel = vi.fn();
    vi.stubGlobal('SpeechSynthesisUtterance', class {
      text: string;
      constructor(text: string) {
        this.text = text;
      }
    });
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: { speak, cancel },
    });

    const { result } = renderHook(() => useCprFeedback({ audioEnabled: true, hapticsEnabled: false }));
    await waitFor(() => expect(result.current.audioSupported).toBe(true));

    act(() => result.current.speak('Prepare epinephrine', 'epi-1'));
    expect(speak).not.toHaveBeenCalled();

    act(() => result.current.unlockAudio());
    act(() => {
      result.current.speak('Prepare epinephrine', 'epi-1');
      result.current.speak('Prepare epinephrine', 'epi-1');
    });

    expect(cancel).toHaveBeenCalled();
    expect(speak).toHaveBeenCalledTimes(1);
  });
});

/**
 * Shared Vitest setup: browser APIs missing in Node test runs.
 */
import "fake-indexeddb/auto";

class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = "en-US";
  onresult: ((ev: unknown) => void) | null = null;
  onerror: ((ev: unknown) => void) | null = null;
  onend: (() => void) | null = null;
  start() {}
  stop() {}
  abort() {}
}

Object.defineProperty(globalThis, "SpeechRecognition", {
  writable: true,
  configurable: true,
  value: MockSpeechRecognition,
});

Object.defineProperty(globalThis, "webkitSpeechRecognition", {
  writable: true,
  configurable: true,
  value: MockSpeechRecognition,
});

if (typeof window !== "undefined") {
  const syncNavigatorOnLine = (online: boolean) => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      get: () => online,
    });
  };

  window.addEventListener("offline", () => syncNavigatorOnLine(false));
  window.addEventListener("online", () => syncNavigatorOnLine(true));
}

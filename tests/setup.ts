import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
  resizeObservers.length = 0;
  intersectionObservers.length = 0;
});

// --- ResizeObserver ---
// jsdom has no ResizeObserver. Instances are recorded so tests can drive
// entry.contentRect callbacks manually (see triggerResize in tests/helpers).
export const resizeObservers: ResizeObserverMock[] = [];
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  constructor(public callback: ResizeObserverCallback) {
    resizeObservers.push(this);
  }
  emit(rect: Partial<DOMRectReadOnly>, target?: Element) {
    this.callback(
      [{ contentRect: rect, target } as ResizeObserverEntry],
      this as unknown as ResizeObserver,
    );
  }
}
vi.stubGlobal("ResizeObserver", ResizeObserverMock);

// --- IntersectionObserver ---
export const intersectionObservers: IntersectionObserverMock[] = [];
class IntersectionObserverMock {
  root = null;
  rootMargin = "";
  thresholds = [];
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
  constructor(
    public callback: IntersectionObserverCallback,
    public options?: IntersectionObserverInit,
  ) {
    intersectionObservers.push(this);
  }
  emit(entry: Partial<IntersectionObserverEntry>) {
    this.callback(
      [entry as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}
vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);

// --- matchMedia ---
// isTouchDevice() calls window.matchMedia("(pointer: coarse)").
// Default: non-touch device (desktop) — the wheel/drag code path.
if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

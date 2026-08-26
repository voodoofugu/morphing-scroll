import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, renderHook, act } from "@testing-library/react";
import useIdent from "@morphing-scroll/src/hooks/useIdent";
import useUpdate from "@morphing-scroll/src/hooks/useUpdate";
import useConst from "@morphing-scroll/src/hooks/useConst";

describe("useIdent", () => {
  it("keeps the same id across re-renders", () => {
    const { result, rerender } = renderHook(() => useIdent());
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });

  it("hands out different ids to different instances", () => {
    const seen = new Set<string>();
    const Probe = () => {
      seen.add(useIdent());
      return null;
    };
    render(
      <>
        <Probe />
        <Probe />
        <Probe />
      </>,
    );
    expect(seen.size).toBe(3);
  });
});

describe("useUpdate", () => {
  it("returns a stable callback reference", () => {
    const { result, rerender } = renderHook(() => useUpdate());
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });

  it("forces a re-render when invoked", () => {
    let renders = 0;
    const { result } = renderHook(() => {
      renders++;
      return useUpdate();
    });
    expect(renders).toBe(1);

    act(() => result.current());

    expect(renders).toBe(2);
  });
});

describe("useConst", () => {
  it("calls the factory once and keeps the value across re-renders", () => {
    const factory = vi.fn(() => ({ id: Math.random() }));
    const { result, rerender } = renderHook(() => useConst(factory));
    const first = result.current;

    rerender();
    rerender();

    expect(factory).toHaveBeenCalledTimes(1);
    expect(result.current).toBe(first);
  });

  it("builds a separate value for every instance", () => {
    const seen = new Set<object>();
    const Probe = () => {
      seen.add(useConst(() => ({})));
      return null;
    };
    render(
      <>
        <Probe />
        <Probe />
      </>,
    );
    expect(seen.size).toBe(2);
  });
});

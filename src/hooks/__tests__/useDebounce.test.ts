import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "../useDebounce";

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns initial value immediately without pending status", () => {
    const { result } = renderHook(() => useDebounce("initial", 250));
    expect(result.current[0]).toBe("initial");
    expect(result.current[1]).toBe(false);
  });

  it("sets isPending to true upon value change and updates after delay", () => {
    const { result, rerender } = renderHook(
      ({ val }) => useDebounce(val, 250),
      {
        initialProps: { val: "initial" },
      },
    );

    expect(result.current[0]).toBe("initial");
    expect(result.current[1]).toBe(false);

    // Update value
    rerender({ val: "updated" });
    expect(result.current[0]).toBe("initial");
    expect(result.current[1]).toBe(true);

    // Advance halfway
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(result.current[0]).toBe("initial");
    expect(result.current[1]).toBe(true);

    // Advance remaining time
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current[0]).toBe("updated");
    expect(result.current[1]).toBe(false);
  });

  it("resets timer if value updates rapidly before delay finishes", () => {
    const { result, rerender } = renderHook(
      ({ val }) => useDebounce(val, 250),
      {
        initialProps: { val: "v1" },
      },
    );

    rerender({ val: "v2" });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    rerender({ val: "v3" });
    act(() => {
      vi.advanceTimersByTime(150);
    });
    // Still not finished because timer restarted for v3
    expect(result.current[0]).toBe("v1");
    expect(result.current[1]).toBe(true);

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current[0]).toBe("v3");
    expect(result.current[1]).toBe(false);
  });
});

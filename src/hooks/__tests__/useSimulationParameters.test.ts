import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useSimulationParameters,
  INITIAL_GLOBAL_PARAMETERS,
} from "../useSimulationParameters";

describe("useSimulationParameters", () => {
  it("initializes with default parameter sets", () => {
    const { result } = renderHook(() => useSimulationParameters());
    expect(result.current.globalParams.monthlySavings).toBe(
      INITIAL_GLOBAL_PARAMETERS.monthlySavings,
    );
    expect(result.current.globalParams.ageStart).toBe(30);
    expect(result.current.globalParams.ageRetirement).toBe(67);
  });

  it("updates parameters and resets to defaults", () => {
    const { result } = renderHook(() => useSimulationParameters());

    act(() => {
      result.current.setGlobalParams((prev) => ({
        ...prev,
        monthlySavings: 750,
      }));
    });

    expect(result.current.globalParams.monthlySavings).toBe(750);

    act(() => {
      result.current.resetToDefaults();
    });

    expect(result.current.globalParams.monthlySavings).toBe(
      INITIAL_GLOBAL_PARAMETERS.monthlySavings,
    );
  });
});

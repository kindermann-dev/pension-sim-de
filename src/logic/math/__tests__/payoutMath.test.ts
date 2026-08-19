import { describe, it, expect } from "vitest";
import { findRequiredGrossForTargetNet } from "../payoutMath";

describe("payoutMath", () => {
  describe("findRequiredGrossForTargetNet", () => {
    it("accurately resolves required gross withdrawal for a target net amount", () => {
      // Suppose tax is 25% on everything above 0
      const calcNetFn = (gross: number) => gross * 0.75;
      const targetNet = 1500;
      const maxPossibleGross = 5000;

      const grossNeeded = findRequiredGrossForTargetNet(
        targetNet,
        maxPossibleGross,
        calcNetFn,
      );

      // 1500 / 0.75 = 2000
      expect(grossNeeded).toBeCloseTo(2000, 2);
      expect(calcNetFn(grossNeeded)).toBeCloseTo(targetNet, 2);
    });

    it("handles boundary condition when max possible gross cannot satisfy target net", () => {
      const calcNetFn = (gross: number) => gross * 0.5;
      const targetNet = 3000;
      const maxPossibleGross = 2000; // Even 2000 * 0.5 = 1000 < 3000

      const result = findRequiredGrossForTargetNet(
        targetNet,
        maxPossibleGross,
        calcNetFn,
      );
      expect(result).toBe(maxPossibleGross);
    });

    it("handles 0 fees and 0 taxes (gross equals net)", () => {
      const calcNetFn = (gross: number) => gross;
      const targetNet = 1200;
      const maxPossibleGross = 10000;

      const grossNeeded = findRequiredGrossForTargetNet(
        targetNet,
        maxPossibleGross,
        calcNetFn,
      );
      expect(grossNeeded).toBeCloseTo(1200, 2);
    });

    it("handles high progressive tax jumps", () => {
      // Allowance of 1000€ (0% tax), then 30% tax on amounts above 1000€
      const calcNetFn = (gross: number) => {
        if (gross <= 1000) return gross;
        return 1000 + (gross - 1000) * 0.7;
      };

      const targetNet = 1700; // 1000 + (gross - 1000) * 0.70 = 1700 => (gross - 1000) = 1000 => gross = 2000
      const grossNeeded = findRequiredGrossForTargetNet(
        targetNet,
        50000,
        calcNetFn,
      );
      expect(grossNeeded).toBeCloseTo(2000, 2);
      expect(calcNetFn(grossNeeded)).toBeCloseTo(1700, 2);
    });
  });
});

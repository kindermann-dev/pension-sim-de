import { describe, it, expect } from "vitest";
import {
  calculateMonthlyReturnRate,
  calculateNetInvestment,
  calculateSharesToBuy,
  applyDynamics,
  calculateEffectiveCapitalGainsTaxRate,
  calculatePricePerformance,
  calculatePortfolioValue,
  calculateTaxWithAllowance,
  formatCurrency,
} from "../commonMath";

describe("commonMath", () => {
  describe("calculateMonthlyReturnRate", () => {
    it("calculates monthly return rate accurately from annual rate", () => {
      const annualRate = 7; // 7% p.a.
      const monthlyRate = calculateMonthlyReturnRate(annualRate);
      // (1 + 0.07)^(1/12) - 1 ≈ 0.005654
      expect(monthlyRate).toBeCloseTo(0.005654, 6);

      // Compounded back over 12 months should equal annual rate
      const annualCompounded = Math.pow(1 + monthlyRate, 12) - 1;
      expect(annualCompounded).toBeCloseTo(0.07, 6);
    });

    it("handles 0% annual return rate", () => {
      expect(calculateMonthlyReturnRate(0)).toBe(0);
    });

    it("handles negative annual return rate correctly", () => {
      const negativeRate = -10; // -10% p.a.
      const monthlyRate = calculateMonthlyReturnRate(negativeRate);
      // (1 - 0.10)^(1/12) - 1 ≈ -0.00874161
      expect(monthlyRate).toBeCloseTo(-0.0087416, 5);
      const annualCompounded = Math.pow(1 + monthlyRate, 12) - 1;
      expect(annualCompounded).toBeCloseTo(-0.1, 6);
    });

    it("handles extreme annual returns (e.g. 100%)", () => {
      const highRate = 100;
      const monthlyRate = calculateMonthlyReturnRate(highRate);
      const annualCompounded = Math.pow(1 + monthlyRate, 12) - 1;
      expect(annualCompounded).toBeCloseTo(1.0, 6);
    });
  });

  describe("calculateNetInvestment", () => {
    it("calculates net investment after absolute and relative fees", () => {
      const gross = 1000;
      const absFee = 1.5;
      const relFeePercent = 0.2; // 0.2% = 2€
      const net = calculateNetInvestment(gross, absFee, relFeePercent);
      // 1000 - 1.5 - 2 = 996.5
      expect(net).toBe(996.5);
    });

    it("returns 0 if gross investment is 0 or negative", () => {
      expect(calculateNetInvestment(0, 1.5, 0.2)).toBe(0);
      expect(calculateNetInvestment(-100, 1.5, 0.2)).toBe(0);
    });

    it("clamps to 0 when absolute and relative fees exceed gross amount", () => {
      const gross = 10;
      const absFee = 15; // Fee larger than gross
      const relFeePercent = 1.0;
      expect(calculateNetInvestment(gross, absFee, relFeePercent)).toBe(0);
    });

    it("handles 0% relative fees and 0 absolute fee", () => {
      expect(calculateNetInvestment(500, 0, 0)).toBe(500);
    });
  });

  describe("calculateSharesToBuy", () => {
    it("calculates shares to buy given price", () => {
      expect(calculateSharesToBuy(1000, 100)).toBe(10);
      expect(calculateSharesToBuy(550.5, 55.05)).toBeCloseTo(10, 4);
    });

    it("returns 0 when price is 0 or negative", () => {
      expect(calculateSharesToBuy(1000, 0)).toBe(0);
      expect(calculateSharesToBuy(1000, -10)).toBe(0);
    });

    it("returns 0 when net investment is 0 or negative", () => {
      expect(calculateSharesToBuy(0, 100)).toBe(0);
      expect(calculateSharesToBuy(-50, 100)).toBe(0);
    });
  });

  describe("applySavingsDynamics", () => {
    it("applies positive annual savings dynamics", () => {
      const currentRate = 250;
      const dynamicsPercent = 2; // 2%
      expect(applyDynamics(currentRate, dynamicsPercent)).toBe(255);
    });

    it("returns original rate when dynamics is 0%", () => {
      expect(applyDynamics(300, 0)).toBe(300);
    });

    it("handles negative dynamics rate (savings rate reduction)", () => {
      expect(applyDynamics(200, -5)).toBe(190);
    });
  });

  describe("calculateEffectiveCapitalGainsTaxRate", () => {
    it("calculates German Abgeltungsteuer + 5.5% Soli correctly (26.375%)", () => {
      const rate = calculateEffectiveCapitalGainsTaxRate(25, 5.5, 0);
      // 25% * (1 + 0.055) = 26.375% = 0.26375
      expect(rate).toBeCloseTo(0.26375, 5);
    });

    it("calculates tax rate with 9% church tax correctly according to § 32d Abs. 1 S. 3 EStG", () => {
      // With 9% Church Tax:
      // baseTaxRate = 0.25 / (1 + 0.25 * 0.09) = 0.25 / 1.0225 ≈ 0.244498777
      // total = baseTaxRate * (1 + 0.055 + 0.09) = baseTaxRate * 1.145 ≈ 0.279951
      const rate = calculateEffectiveCapitalGainsTaxRate(25, 5.5, 9);
      expect(rate).toBeCloseTo(0.279951, 5);
    });

    it("calculates tax rate with 8% church tax (Bavaria / Baden-Württemberg)", () => {
      // baseTaxRate = 0.25 / (1 + 0.25 * 0.08) = 0.25 / 1.02 ≈ 0.245098
      // total = baseTaxRate * (1 + 0.055 + 0.08) = baseTaxRate * 1.135 ≈ 0.278186
      const rate = calculateEffectiveCapitalGainsTaxRate(25, 5.5, 8);
      expect(rate).toBeCloseTo(0.278186, 5);
    });

    it("handles 0% capital gains tax rate", () => {
      expect(calculateEffectiveCapitalGainsTaxRate(0, 5.5, 9)).toBe(0);
    });

    it("handles 0% soli rate", () => {
      const rate = calculateEffectiveCapitalGainsTaxRate(25, 0, 0);
      expect(rate).toBe(0.25);
    });
  });

  describe("calculatePricePerformance", () => {
    it("calculates updated price based on positive return rate", () => {
      const currentPrice = 100;
      const monthlyReturn = 0.005; // +0.5%
      const newPrice = calculatePricePerformance(currentPrice, monthlyReturn);
      expect(newPrice).toBeCloseTo(100.5, 4);
    });

    it("calculates updated price based on negative return rate", () => {
      const currentPrice = 100;
      const monthlyReturn = -0.02; // -2.0%
      const newPrice = calculatePricePerformance(currentPrice, monthlyReturn);
      expect(newPrice).toBeCloseTo(98.0, 4);
    });

    it("returns unchanged price when return rate is 0", () => {
      expect(calculatePricePerformance(150, 0)).toBe(150);
    });
  });

  describe("calculatePortfolioValue", () => {
    it("calculates total value from share price and total shares", () => {
      expect(calculatePortfolioValue(120, 50)).toBe(6000);
      expect(calculatePortfolioValue(100, 25.5)).toBeCloseTo(2550, 4);
    });

    it("returns 0 when share price or total shares is 0 or negative", () => {
      expect(calculatePortfolioValue(100, 0)).toBe(0);
      expect(calculatePortfolioValue(0, 50)).toBe(0);
      expect(calculatePortfolioValue(-10, 50)).toBe(0);
      expect(calculatePortfolioValue(100, -5)).toBe(0);
    });
  });

  describe("calculateTaxWithAllowance", () => {
    it("applies partial tax exemption, consumes allowance, and calculates tax", () => {
      const taxable = 1000;
      const partialTaxExemptionPercent = 30; // 30% TFS => 700€
      const availableTaxAllowance = 500; // 500€ allowance => 200€ taxable
      const effectiveTaxRate = 0.26375; // 26.375%

      const result = calculateTaxWithAllowance(
        taxable,
        partialTaxExemptionPercent,
        availableTaxAllowance,
        effectiveTaxRate,
      );

      expect(result.taxableAfterTFS).toBeCloseTo(700, 4);
      expect(result.consumedAllowance).toBe(500);
      expect(result.taxableAfterAllowance).toBeCloseTo(200, 4);
      expect(result.taxAmount).toBeCloseTo(200 * 0.26375, 4);
    });

    it("returns 0 tax when taxable amount is fully covered by allowance", () => {
      const result = calculateTaxWithAllowance(500, 30, 1000, 0.26375);
      expect(result.taxableAfterTFS).toBeCloseTo(350, 4);
      expect(result.consumedAllowance).toBe(350);
      expect(result.taxableAfterAllowance).toBe(0);
      expect(result.taxAmount).toBe(0);
    });

    it("returns 0 values when taxable base is 0 or negative", () => {
      const result = calculateTaxWithAllowance(0, 30, 1000, 0.26375);
      expect(result.taxAmount).toBe(0);
      expect(result.consumedAllowance).toBe(0);
      expect(result.taxableAfterTFS).toBe(0);
      expect(result.taxableAfterAllowance).toBe(0);
    });

    it("handles 100% partial tax exemption", () => {
      const result = calculateTaxWithAllowance(1000, 100, 1000, 0.26375);
      expect(result.taxableAfterTFS).toBe(0);
      expect(result.consumedAllowance).toBe(0);
      expect(result.taxAmount).toBe(0);
    });
  });

  describe("formatCurrency", () => {
    it("formats numbers into German currency representation", () => {
      const formatted = formatCurrency(1234.56);
      expect(formatted).toContain("1.234,56");
      expect(formatted).toContain("€");
    });

    it("handles 0 and negative amounts", () => {
      expect(formatCurrency(0)).toContain("0,00");
      expect(formatCurrency(-500)).toContain("-500,00");
    });
  });
});

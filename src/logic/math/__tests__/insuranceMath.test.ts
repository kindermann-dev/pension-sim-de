import { describe, it, expect } from "vitest";
import {
  calculateAlphaCost,
  calculateInsuranceNetInvestment,
  calculateSpecialPaymentNetInvestment,
  calculateGammaCostShares,
  calculateInsuranceWithdrawalTaxAndAllowance,
  calculateSurplusShares,
  calculateInsuranceNetValue,
  calculateInsuranceSurrenderAndNetValue,
} from "../insuranceMath";

describe("insuranceMath", () => {
  describe("calculateAlphaCost", () => {
    it("applies Zillmer costs during initial 60 months and regular alpha costs throughout", () => {
      const monthlyContribution = 200;
      const totalMonths = 360; // 30 years
      const zillmerRatePercent = 2.5; // 2.5% of total = 1,800€ over 60 months = 30€/mo
      const remainingRatePercent = 1.0; // 1.0% of total = 720€ over 360 months = 2€/mo

      // Month 1 (within Zillmer period): 30€ + 2€ = 32€
      const costMonth1 = calculateAlphaCost(
        monthlyContribution,
        totalMonths,
        zillmerRatePercent,
        remainingRatePercent,
        1,
        60,
      );
      expect(costMonth1).toBeCloseTo(32, 4);

      // Month 61 (after Zillmer period): 2€
      const costMonth61 = calculateAlphaCost(
        monthlyContribution,
        totalMonths,
        zillmerRatePercent,
        remainingRatePercent,
        61,
        60,
      );
      expect(costMonth61).toBeCloseTo(2, 4);
    });

    it("returns 0 when monthly contribution is 0 or negative", () => {
      expect(calculateAlphaCost(0, 360, 2.5, 1.0, 1, 60)).toBe(0);
      expect(calculateAlphaCost(-100, 360, 2.5, 1.0, 1, 60)).toBe(0);
    });

    it("returns 0 when totalMonths is 0", () => {
      expect(calculateAlphaCost(200, 0, 2.5, 1.0, 1, 60)).toBe(0);
    });
  });

  describe("calculateInsuranceNetInvestment", () => {
    it("deducts alpha, beta contribution cost, and monthly fixed cost", () => {
      const grossContribution = 250;
      const alphaCost = 30;
      const betaRatePercent = 5.0; // 5% = 12.50€
      const fixedCostPa = 24; // 2€/mo

      const net = calculateInsuranceNetInvestment(
        grossContribution,
        alphaCost,
        betaRatePercent,
        fixedCostPa,
      );

      // 250 - 30 - 12.5 - 2 = 205.5
      expect(net).toBeCloseTo(205.5, 4);
    });

    it("clamps to 0 when total insurance costs exceed gross contribution", () => {
      const grossContribution = 20;
      const alphaCost = 25; // Exceeds gross
      const betaRatePercent = 5.0;
      const fixedCostPa = 24;

      const net = calculateInsuranceNetInvestment(
        grossContribution,
        alphaCost,
        betaRatePercent,
        fixedCostPa,
      );

      expect(net).toBe(0);
    });

    it("returns 0 for 0 contribution", () => {
      expect(calculateInsuranceNetInvestment(0, 30, 5, 24)).toBe(0);
    });
  });

  describe("calculateSpecialPaymentNetInvestment", () => {
    it("calculates alpha, beta costs and net investment on a special payment correctly", () => {
      // 1,000€ special payment, 2.5% alpha (25€), 1.75% beta (17.50€)
      // Total costs = 42.50€
      // Net investment = 957.50€
      const result = calculateSpecialPaymentNetInvestment(1000, 2.5, 1.75);
      expect(result.alphaCost).toBeCloseTo(25, 4);
      expect(result.betaCost).toBeCloseTo(17.5, 4);
      expect(result.totalCosts).toBeCloseTo(42.5, 4);
      expect(result.netInvestment).toBeCloseTo(957.5, 4);
    });

    it("returns 0 for non-positive special payment amounts", () => {
      const resultZero = calculateSpecialPaymentNetInvestment(0, 2.5, 1.75);
      expect(resultZero.totalCosts).toBe(0);
      expect(resultZero.netInvestment).toBe(0);

      const resultNeg = calculateSpecialPaymentNetInvestment(-500, 2.5, 1.75);
      expect(resultNeg.totalCosts).toBe(0);
      expect(resultNeg.netInvestment).toBe(0);
    });

    it("clamps net investment to 0 when cost rates exceed 100%", () => {
      const result = calculateSpecialPaymentNetInvestment(100, 60, 50);
      expect(result.totalCosts).toBe(110);
      expect(result.netInvestment).toBe(0);
    });
  });

  describe("calculateGammaCostShares", () => {
    it("computes monthly asset-management fee in units/shares", () => {
      const totalShares = 1200;
      const gammaRatePercent = 0.24; // 0.24% p.a. => 0.02% per month
      const sharesToSell = calculateGammaCostShares(
        totalShares,
        gammaRatePercent,
      );
      // 1200 * (0.0024 / 12) = 1200 * 0.0002 = 0.24 shares
      expect(sharesToSell).toBeCloseTo(0.24, 6);
    });

    it("returns 0 when totalShares or gammaRate is 0 or negative", () => {
      expect(calculateGammaCostShares(0, 0.24)).toBe(0);
      expect(calculateGammaCostShares(1200, 0)).toBe(0);
      expect(calculateGammaCostShares(-10, 0.24)).toBe(0);
    });
  });

  describe("calculateInsuranceWithdrawalTaxAndAllowance", () => {
    it("computes tax with Halbeinkünfteverfahren (§ 20 Abs. 1 Nr. 6 EStG)", () => {
      // 100,000€ total value, 40,000€ total invested => 60% gain ratio
      // Withdrawing 10,000€ => 6,000€ gain portion
      // Halbeinkünfte (50%) => 3,000€
      // 15% insurance partial tax exemption => 3,000 * 0.85 = 2,550€ taxable gain
      // Allowance: 550€ => Final taxable: 2,000€
      // Marginal tax rate: 30% => Tax: 600€
      const result = calculateInsuranceWithdrawalTaxAndAllowance(
        10000,
        100000,
        40000,
        30, // 30% marginal tax rate
        25, // KEST (not used in Halbeinkünfte)
        5.5,
        0,
        15, // 15% partial exemption
        true, // Halbeinkünfteverfahren active
        550, // 550€ allowance
      );

      expect(result.consumedTaxAllowance).toBeCloseTo(550, 4);
      expect(result.tax).toBeCloseTo(600, 4);
    });

    it("computes standard tax with calculateEffectiveCapitalGainsTaxRate when Halbeinkünfteverfahren is inactive", () => {
      // 100,000€ total value, 50,000€ invested => 50% gain ratio
      // Withdrawing 10,000€ => 5,000€ gain portion
      // 15% partial exemption => 5,000 * 0.85 = 4,250€ taxable
      // 0 allowance => Taxable = 4,250€
      // Standard Abgeltungsteuer 25% + 5.5% Soli = 26.375%
      // Tax: 4,250 * 0.26375 = 1,120.9375€
      const result = calculateInsuranceWithdrawalTaxAndAllowance(
        10000,
        100000,
        50000,
        30,
        25,
        5.5,
        0,
        15,
        false, // Standard Abgeltungsteuer
        0,
      );

      expect(result.tax).toBeCloseTo(1120.9375, 4);
      expect(result.consumedTaxAllowance).toBe(0);
    });

    it("returns zero tax if total value is below or equal to invested capital (loss or break-even)", () => {
      const result = calculateInsuranceWithdrawalTaxAndAllowance(
        1000,
        50000,
        60000, // No profit
        30,
        25,
        5.5,
        0,
        15,
        true,
        1000,
      );

      expect(result.tax).toBe(0);
      expect(result.consumedTaxAllowance).toBe(0);
    });

    it("returns zero tax when withdrawal is 0", () => {
      const result = calculateInsuranceWithdrawalTaxAndAllowance(
        0,
        100000,
        50000,
        30,
        25,
        5.5,
        0,
        15,
        true,
        1000,
      );
      expect(result.tax).toBe(0);
      expect(result.consumedTaxAllowance).toBe(0);
    });
  });

  describe("calculateSurplusShares", () => {
    it("computes surplus participation shares correctly", () => {
      const totalShares = 1200;
      const surplusRatePercent = 0.36; // 0.36% p.a. => 0.03% / mo
      const shares = calculateSurplusShares(totalShares, surplusRatePercent);
      expect(shares).toBeCloseTo(1200 * (0.0036 / 12), 6);
    });

    it("returns 0 when surplus rate or shares is 0 or negative", () => {
      expect(calculateSurplusShares(1200, 0)).toBe(0);
      expect(calculateSurplusShares(0, 0.36)).toBe(0);
    });
  });

  describe("calculateInsuranceNetValue", () => {
    it("returns gross value when there is no profit", () => {
      expect(
        calculateInsuranceNetValue(
          50000,
          60000,
          15,
          true,
          15,
          65,
          1000,
          30,
          0.26375,
        ),
      ).toBe(50000);
      expect(
        calculateInsuranceNetValue(0, 0, 15, true, 15, 65, 1000, 30, 0.26375),
      ).toBe(0);
    });

    it("calculates net surrender value under 12/62 Halbeinkünfteverfahren when qualified", () => {
      // Insurance value = 100,000€, Invested = 40,000€ => Profit = 60,000€
      // Qualified (duration 15 >= 12, age 65 >= 62)
      // 50% * (1 - 0.15 TFS) = 42.5% taxable = 25,500€
      // After 1,000€ FSA = 24,500€
      // Tax at 30% marginal rate = 7,350€
      // Net value = 100,000 - 7,350 = 92,650€
      const netVal = calculateInsuranceNetValue(
        100000,
        40000,
        15,
        true,
        15,
        65,
        1000,
        30,
        0.26375,
      );
      expect(netVal).toBeCloseTo(92650, 2);
    });

    it("calculates net surrender value with standard Abgeltungsteuer when 12/62 rule is not met", () => {
      // Duration = 5 years (not >= 12), Age = 35 (not >= 62)
      // Profit = 60,000€
      // 100% * (1 - 0.15 TFS) = 85% taxable = 51,000€
      // After 1,000€ FSA = 50,000€
      // Tax at 26.375% = 13,187.50€
      // Net value = 100,000 - 13,187.50 = 86,812.50€
      const netVal = calculateInsuranceNetValue(
        100000,
        40000,
        15,
        true,
        5,
        35,
        1000,
        30,
        0.26375,
      );
      expect(netVal).toBeCloseTo(86812.5, 2);
    });
  });

  describe("calculateInsuranceSurrenderAndNetValue", () => {
    it("deducts unamortized alpha costs during the 5-year Zillmer period", () => {
      // Total planned term: 360 months (30 years) at 200€/mo = 72,000€ total
      // Alpha Zillmer rate: 2.5% = 1,800€
      // Cancellation at Month 12 (1 year in):
      // Remaining Zillmer months = 60 - 12 = 48 months
      // Unamortized alpha = 1,800 * (48 / 60) = 1,440€
      // Total invested = 2,400€ (12 * 200€)
      // Gross value = 3,000€ (with some growth)
      // Surrender value = 3,000 - 1,440 = 1,560€
      // Since surrender value (1,560€) < total invested (2,400€) -> profit is 0 -> latent tax = 0
      // Net liquidity value = 1,560€
      const result = calculateInsuranceSurrenderAndNetValue(
        30, // 30 shares
        100, // 100€ share price => 3000€ gross
        2400, // total invested
        12, // month 12
        360, // 360 total months
        2.5, // 2.5% Zillmer rate
        60, // 60 Zillmer months
        15, // 15% TFS
        true, // 12/62 active
        1, // 1 year duration
        31, // age 31
        1000, // 1000€ FSA
        30, // 30% marginal rate
        0.26375, // 26.375% Abgeltungsteuer
      );

      expect(result.insuranceGrossValue).toBe(3000);
      expect(result.insuranceSurrenderValue).toBeCloseTo(1560, 2);
      expect(result.latentTax).toBe(0);
      expect(result.insuranceNetLiquidityValue).toBeCloseTo(1560, 2);
    });

    it("does not deduct unamortized alpha costs after the 60-month Zillmer period and applies 12/62 rule when qualified", () => {
      // Cancellation at Month 180 (15 years in), Age = 65
      // Gross value = 100,000€, Invested = 40,000€
      // Surrender value = 100,000€ (no unamortized alpha)
      // Profit = 60,000€
      // Qualified for 12/62: 50% * 0.85 = 25,500€ taxable
      // After 1,000€ FSA = 24,500€
      // Tax at 30% marginal rate = 7,350€
      // Net liquidity value = 100,000 - 7,350 = 92,650€
      const result = calculateInsuranceSurrenderAndNetValue(
        1000,
        100,
        40000,
        180,
        360,
        2.5,
        60,
        15,
        true,
        15,
        65,
        1000,
        30,
        0.26375,
      );

      expect(result.insuranceGrossValue).toBe(100000);
      expect(result.insuranceSurrenderValue).toBe(100000);
      expect(result.latentTax).toBeCloseTo(7350, 2);
      expect(result.insuranceNetLiquidityValue).toBeCloseTo(92650, 2);
    });

    it("taxes 100% of profit with Abgeltungsteuer when 12/62 criteria are not met", () => {
      // Cancellation at Month 72 (6 years in, after Zillmer), Age = 36 (not >= 62)
      // Gross value = 50,000€, Invested = 20,000€
      // Surrender value = 50,000€
      // Profit = 30,000€
      // 100% * 0.85 TFS = 25,500€
      // After 1,000€ FSA = 24,500€
      // Tax at 26.375% Abgeltungsteuer = 6,461.875€
      // Net liquidity value = 50,000 - 6,461.875 = 43,538.125€
      const result = calculateInsuranceSurrenderAndNetValue(
        500,
        100,
        20000,
        72,
        360,
        2.5,
        60,
        15,
        true,
        6,
        36,
        1000,
        30,
        0.26375,
      );

      expect(result.insuranceGrossValue).toBe(50000);
      expect(result.insuranceSurrenderValue).toBe(50000);
      expect(result.latentTax).toBeCloseTo(6461.875, 3);
      expect(result.insuranceNetLiquidityValue).toBeCloseTo(43538.125, 3);
    });
  });
});

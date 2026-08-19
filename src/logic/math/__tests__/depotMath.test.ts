import { describe, it, expect } from "vitest";
import {
  calculateAdvanceTaxBaseYield,
  sellDepotSharesFIFO,
  sellDepotShares,
  sellAllDepotShares,
  calculateAdvanceYieldsAndUpdateTranches,
  calculateDepotNetValue,
  calculateDepotLiquidationValue,
  calculateDepotValue,
} from "../depotMath";
import type { DepotTranche, DepotTaxState } from "../../../types/simulation";

describe("depotMath", () => {
  describe("calculateDepotValue", () => {
    it("calculates total portfolio value as share price multiplied by total shares across tranches", () => {
      const tranches: DepotTranche[] = [
        {
          month: 1,
          shares: 10,
          purchasePricePerShare: 100,
          accumulatedAdvanceYieldPerShare: 0,
        },
        {
          month: 2,
          shares: 20.5,
          purchasePricePerShare: 105,
          accumulatedAdvanceYieldPerShare: 0,
        },
        {
          month: 3,
          shares: 5,
          purchasePricePerShare: 110,
          accumulatedAdvanceYieldPerShare: 0,
        },
      ];
      // Total shares = 35.5, current price = 150 => 35.5 * 150 = 5325
      const totalValue = calculateDepotValue(150, tranches);
      expect(totalValue).toBeCloseTo(5325, 2);
    });

    it("returns 0 when tranches array is empty", () => {
      expect(calculateDepotValue(150, [])).toBe(0);
    });

    it("returns 0 when share price is 0", () => {
      const tranches: DepotTranche[] = [
        {
          month: 1,
          shares: 10,
          purchasePricePerShare: 100,
          accumulatedAdvanceYieldPerShare: 0,
        },
      ];
      expect(calculateDepotValue(0, tranches)).toBe(0);
    });

    it("handles tranches with 0 shares correctly", () => {
      const tranches: DepotTranche[] = [
        {
          month: 1,
          shares: 0,
          purchasePricePerShare: 100,
          accumulatedAdvanceYieldPerShare: 0,
        },
        {
          month: 2,
          shares: 15,
          purchasePricePerShare: 100,
          accumulatedAdvanceYieldPerShare: 0,
        },
      ];
      expect(calculateDepotValue(100, tranches)).toBeCloseTo(1500, 2);
    });
  });
  describe("calculateAdvanceTaxBaseYield", () => {
    it("calculates base yield according to § 18 InvStG (capital * baseRate * 0.7)", () => {
      const capital = 100000;
      const baseRatePercent = 2.55;
      const baseYield = calculateAdvanceTaxBaseYield(capital, baseRatePercent);
      // 100,000 * 0.0255 * 0.7 = 1785
      expect(baseYield).toBeCloseTo(1785, 2);
    });

    it("returns 0 if capital or base rate is 0", () => {
      expect(calculateAdvanceTaxBaseYield(0, 2.55)).toBe(0);
      expect(calculateAdvanceTaxBaseYield(100000, 0)).toBe(0);
    });
  });

  describe("sellDepotSharesFIFO", () => {
    it("reduces tranches in strict First-In-First-Out order and computes taxable gain", () => {
      const tranches: DepotTranche[] = [
        {
          month: 1,
          shares: 10,
          purchasePricePerShare: 100,
          accumulatedAdvanceYieldPerShare: 0,
        },
        {
          month: 2,
          shares: 15,
          purchasePricePerShare: 110,
          accumulatedAdvanceYieldPerShare: 0,
        },
      ];

      // Current price is 120. Selling 1200€ worth of shares => 10 shares
      // Tranche 1 should be completely consumed and removed, Tranche 2 intact.
      // Gain = 10 * (120 - 100) = 200
      const result = sellDepotSharesFIFO(tranches, 1200, 120);
      expect(result.updatedTranches).toHaveLength(1);
      expect(result.updatedTranches[0]?.month).toBe(2);
      expect(result.updatedTranches[0]?.shares).toBe(15);
      expect(result.taxableGain).toBeCloseTo(200, 2);
    });

    it("partially consumes a tranche and leaves remaining shares", () => {
      const tranches: DepotTranche[] = [
        {
          month: 1,
          shares: 10,
          purchasePricePerShare: 100,
          accumulatedAdvanceYieldPerShare: 0,
        },
        {
          month: 2,
          shares: 10,
          purchasePricePerShare: 100,
          accumulatedAdvanceYieldPerShare: 0,
        },
      ];

      // Selling 15 shares (1500€ at 100€/share)
      const result = sellDepotSharesFIFO(tranches, 1500, 100);
      expect(result.updatedTranches).toHaveLength(1);
      expect(result.updatedTranches[0]?.month).toBe(2);
      expect(result.updatedTranches[0]?.shares).toBe(5);
    });

    it("returns empty array when all tranches are completely sold", () => {
      const tranches: DepotTranche[] = [
        {
          month: 1,
          shares: 10,
          purchasePricePerShare: 100,
          accumulatedAdvanceYieldPerShare: 0,
        },
        {
          month: 2,
          shares: 5,
          purchasePricePerShare: 100,
          accumulatedAdvanceYieldPerShare: 0,
        },
      ];

      // Selling 20 shares (more than 15 total shares)
      const result = sellDepotSharesFIFO(tranches, 2000, 100);
      expect(result.updatedTranches).toHaveLength(0);
    });

    it("handles empty tranches array or zero amount", () => {
      expect(sellDepotSharesFIFO([], 1000, 100).updatedTranches).toEqual([]);
      const tranches: DepotTranche[] = [
        {
          month: 1,
          shares: 10,
          purchasePricePerShare: 100,
          accumulatedAdvanceYieldPerShare: 0,
        },
      ];
      expect(sellDepotSharesFIFO(tranches, 0, 100).updatedTranches).toEqual(
        tranches,
      );
      expect(sellDepotSharesFIFO(tranches, -500, 100).updatedTranches).toEqual(
        tranches,
      );
      expect(sellDepotSharesFIFO(tranches, 500, 0).updatedTranches).toEqual(
        tranches,
      );
    });

    it("does not mutate the original tranche array", () => {
      const original: DepotTranche[] = [
        {
          month: 1,
          shares: 10,
          purchasePricePerShare: 100,
          accumulatedAdvanceYieldPerShare: 0,
        },
      ];
      sellDepotSharesFIFO(original, 500, 100);
      expect(original[0]?.shares).toBe(10);
    });
  });

  describe("sellDepotShares & sellAllDepotShares", () => {
    it("calculates capital gains tax, partial tax exemption, FSA, and order fees on sale", () => {
      const tranches: DepotTranche[] = [
        {
          month: 1,
          shares: 100,
          purchasePricePerShare: 100,
          accumulatedAdvanceYieldPerShare: 0,
        },
      ];

      // Selling 5,000€ at 125€/share (40 shares sold, 60 remain)
      // Gain = 40 * (125 - 100) = 1,000€
      // TFS 30% => taxableAfterTFS = 700€
      // FSA = 500€ => taxableAfterAllowance = 200€
      // Tax @ 25% = 50€
      // Sell fee = 10€ + (5000 * 0.001) = 15€
      // Net payout = 5000 - 50 - 15 = 4935€
      const result = sellDepotShares(
        tranches,
        5000,
        125,
        30,
        500,
        0.25,
        10,
        0.2,
      );

      expect(result.updatedTranches).toHaveLength(1);
      expect(result.updatedTranches[0]?.shares).toBe(60);
      expect(result.taxableGain).toBeCloseTo(1000, 2);
      expect(result.taxableAfterExemption).toBeCloseTo(700, 2);
      expect(result.consumedAllowance).toBeCloseTo(500, 2);
      expect(result.taxableAfterAllowance).toBeCloseTo(200, 2);
      expect(result.taxAmount).toBeCloseTo(50, 2);
      expect(result.effectiveSellFee).toBeCloseTo(15, 2);
      expect(result.netWithdrawal).toBeCloseTo(4935, 2);
    });

    it("liquidates 100% of holdings when using sellAllDepotShares", () => {
      const tranches: DepotTranche[] = [
        {
          month: 1,
          shares: 50,
          purchasePricePerShare: 100,
          accumulatedAdvanceYieldPerShare: 0,
        },
        {
          month: 2,
          shares: 50,
          purchasePricePerShare: 110,
          accumulatedAdvanceYieldPerShare: 0,
        },
      ];

      const result = sellAllDepotShares(tranches, 120, 30, 1000, 0.25, 5, 0.1);
      expect(result.updatedTranches).toHaveLength(0);
      expect(result.netWithdrawal).toBeGreaterThan(10000);
    });
  });

  describe("calculateAdvanceYieldsAndUpdateTranches", () => {
    it("applies time factor and updates accumulated advance yield for prior year tranches", () => {
      const tranches: DepotTranche[] = [
        // Full year tranche (bought in year 1, current is year 2)
        {
          month: 1,
          shares: 10,
          purchasePricePerShare: 100,
          accumulatedAdvanceYieldPerShare: 0,
        },
      ];

      const startOfYearPrice = 100;
      const endOfYearPrice = 110;
      const currentSimulationMonth = 24; // Year 2
      const baseInterestRatePercent = 3.0; // 3%

      const { totalAdvanceYield, updatedTranches } =
        calculateAdvanceYieldsAndUpdateTranches(
          tranches,
          startOfYearPrice,
          endOfYearPrice,
          currentSimulationMonth,
          baseInterestRatePercent,
        );

      // Base yield per share = 100 * 0.03 * 0.7 * 1 = 2.1
      // Actual growth per share = 110 - 100 = 10 (which is > 2.1, so capped at 2.1)
      // Total advance yield = 2.1 * 10 shares = 21
      expect(totalAdvanceYield).toBeCloseTo(21, 4);
      expect(updatedTranches[0]?.accumulatedAdvanceYieldPerShare).toBeCloseTo(
        2.1,
        4,
      );
    });

    it("applies monthly time factor § 18 Abs. 2 S. 3 InvStG for purchases during current year", () => {
      const tranches: DepotTranche[] = [
        // Tranche bought in July (month 7): preceding months = 6, time factor = (12 - 6) / 12 = 0.5
        {
          month: 7,
          shares: 10,
          purchasePricePerShare: 100,
          accumulatedAdvanceYieldPerShare: 0,
        },
      ];

      const startOfYearPrice = 90;
      const endOfYearPrice = 110;
      const currentSimulationMonth = 12; // Year 1
      const baseInterestRatePercent = 3.0;

      const { totalAdvanceYield, updatedTranches } =
        calculateAdvanceYieldsAndUpdateTranches(
          tranches,
          startOfYearPrice,
          endOfYearPrice,
          currentSimulationMonth,
          baseInterestRatePercent,
        );

      // Base yield per share = 100 * 0.03 * 0.7 * (6/12) = 1.05
      // Actual growth = 110 - 100 = 10
      // Advance yield = 1.05 * 10 shares = 10.5
      expect(totalAdvanceYield).toBeCloseTo(10.5, 4);
      expect(updatedTranches[0]?.accumulatedAdvanceYieldPerShare).toBeCloseTo(
        1.05,
        4,
      );
    });

    it("returns 0 advance yield when performance during the year was negative (actual growth <= 0)", () => {
      const tranches: DepotTranche[] = [
        {
          month: 1,
          shares: 10,
          purchasePricePerShare: 100,
          accumulatedAdvanceYieldPerShare: 5,
        },
      ];

      const startOfYearPrice = 100;
      const endOfYearPrice = 95; // Loss year
      const currentSimulationMonth = 24;
      const baseInterestRatePercent = 3.0;

      const { totalAdvanceYield, updatedTranches } =
        calculateAdvanceYieldsAndUpdateTranches(
          tranches,
          startOfYearPrice,
          endOfYearPrice,
          currentSimulationMonth,
          baseInterestRatePercent,
        );

      expect(totalAdvanceYield).toBe(0);
      // Existing accumulated yield must NOT decrease
      expect(updatedTranches[0]?.accumulatedAdvanceYieldPerShare).toBe(5);
    });

    it("caps advance yield at actual growth when growth is smaller than base yield", () => {
      const tranches: DepotTranche[] = [
        {
          month: 1,
          shares: 10,
          purchasePricePerShare: 100,
          accumulatedAdvanceYieldPerShare: 0,
        },
      ];

      const startOfYearPrice = 100;
      const endOfYearPrice = 100.5; // Only 0.50€ growth
      const currentSimulationMonth = 24;
      const baseInterestRatePercent = 3.0; // Base yield would be 2.10€

      const { totalAdvanceYield, updatedTranches } =
        calculateAdvanceYieldsAndUpdateTranches(
          tranches,
          startOfYearPrice,
          endOfYearPrice,
          currentSimulationMonth,
          baseInterestRatePercent,
        );

      // Capped at actual growth: 0.50€ per share * 10 shares = 5.00€
      expect(totalAdvanceYield).toBeCloseTo(5.0, 4);
      expect(updatedTranches[0]?.accumulatedAdvanceYieldPerShare).toBeCloseTo(
        0.5,
        4,
      );
    });
  });

  describe("calculateDepotNetValue", () => {
    it("returns gross value when there are no unrealized capital gains (price <= purchase price)", () => {
      const tranches: DepotTranche[] = [
        {
          month: 1,
          shares: 10,
          purchasePricePerShare: 100,
          accumulatedAdvanceYieldPerShare: 0,
        },
      ];
      // Price is 100, gross is 1000, gain is 0 => net is 1000
      expect(calculateDepotNetValue(tranches, 100, 30, 1000, 0.26375)).toBe(
        1000,
      );
      // Price is 90 (loss), gross is 900 => net is 900
      expect(calculateDepotNetValue(tranches, 90, 30, 1000, 0.26375)).toBe(900);
    });

    it("deducts latent capital gains tax after 30% Teilfreistellung and tax allowance", () => {
      const tranches: DepotTranche[] = [
        {
          month: 1,
          shares: 100,
          purchasePricePerShare: 100,
          accumulatedAdvanceYieldPerShare: 0,
        },
      ];
      // Gross value at 150€/share = 15,000€
      // Raw unrealized gain = 100 * (150 - 100) = 5,000€
      // After 30% TFS = 3,500€
      // After 1,000€ FSA = 2,500€ taxable
      // Latent tax = 2,500 * 0.26375 = 659.375€
      // Net value = 15,000 - 659.375 = 14,340.625€
      const netVal = calculateDepotNetValue(tranches, 150, 30, 1000, 0.26375);
      expect(netVal).toBeCloseTo(14340.625, 3);
    });

    it("credits accumulated advance yields (Vorabpauschale) to prevent double taxation in net value", () => {
      const tranchesWithAdvanceYield: DepotTranche[] = [
        {
          month: 1,
          shares: 100,
          purchasePricePerShare: 100,
          accumulatedAdvanceYieldPerShare: 20,
        },
      ];
      // Gross value at 150€/share = 15,000€
      // Raw gain = 5,000€, but 20€/share was already taxed as Vorabpauschale (2,000€ total)
      // Adjusted gain = 100 * (150 - 100 - 20) = 3,000€
      // After 30% TFS = 2,100€
      // After 1,000€ FSA = 1,100€ taxable
      // Latent tax = 1,100 * 0.26375 = 290.125€
      // Net value = 15,000 - 290.125 = 14,709.875€
      const netVal = calculateDepotNetValue(
        tranchesWithAdvanceYield,
        150,
        30,
        1000,
        0.26375,
      );
      expect(netVal).toBeCloseTo(14709.875, 3);
    });

    it("returns 0 for empty tranches or 0 share price", () => {
      expect(calculateDepotNetValue([], 100, 30, 1000, 0.26375)).toBe(0);
      expect(
        calculateDepotNetValue(
          [
            {
              month: 1,
              shares: 10,
              purchasePricePerShare: 100,
              accumulatedAdvanceYieldPerShare: 0,
            },
          ],
          0,
          30,
          1000,
          0.26375,
        ),
      ).toBe(0);
    });
  });

  describe("calculateDepotLiquidationValue", () => {
    it("calculates full FIFO liquidation with prior advance tax, 30% TFS, FSA, and order fees/spread", () => {
      const tranches: DepotTranche[] = [
        {
          month: 1,
          shares: 100,
          purchasePricePerShare: 100,
          accumulatedAdvanceYieldPerShare: 20,
        },
      ];
      // Gross = 100 * 150 = 15,000€
      // Raw gain = 100 * (150 - 100 - 20 advance yield) = 3,000€
      // TFS 30% => 2,100€
      // Loss carryforward = 600€ => 1,500€
      // FSA = 1,000€ => 500€ taxable
      // Latent tax = 500 * 0.26375 = 131.875€
      // Sell order fee = 10€, spread = 0.2% (half-spread = 0.1% = 15€) => total sell fee = 25€
      // Net liquidity value = 15,000 - 131.875 - 25 = 14,843.125€
      const taxState: DepotTaxState = {
        remainingTaxAllowance: 1000,
        lossCarryforward: 600,
      };
      const result = calculateDepotLiquidationValue(
        tranches,
        150,
        30,
        taxState,
        0.26375,
        10,
        0.2,
      );

      expect(result.grossValue).toBeCloseTo(15000, 2);
      expect(result.latentTax).toBeCloseTo(131.875, 3);
      expect(result.effectiveSellFee).toBeCloseTo(25, 2);
      expect(result.netLiquidityValue).toBeCloseTo(14843.125, 3);
      expect(result.remainingTaxAllowance).toBe(0);
      expect(result.lossCarryforward).toBe(0);
    });

    it("updates loss carryforward when tranches are in negative territory (capital loss)", () => {
      const tranches: DepotTranche[] = [
        {
          month: 1,
          shares: 100,
          purchasePricePerShare: 120,
          accumulatedAdvanceYieldPerShare: 0,
        },
      ];
      // Current price = 100 => loss = 100 * (120 - 100) = 2,000€
      // After 30% TFS => 1,400€ loss added to loss carryforward
      const taxState: DepotTaxState = {
        remainingTaxAllowance: 1000,
        lossCarryforward: 500,
      };
      const result = calculateDepotLiquidationValue(
        tranches,
        100,
        30,
        taxState,
        0.26375,
        0,
        0,
      );

      expect(result.grossValue).toBe(10000);
      expect(result.latentTax).toBe(0);
      expect(result.netLiquidityValue).toBe(10000);
      expect(result.lossCarryforward).toBeCloseTo(500 + 1400, 2);
      expect(result.remainingTaxAllowance).toBe(1000);
    });

    it("handles empty tranches or zero share price", () => {
      const taxState: DepotTaxState = {
        remainingTaxAllowance: 1000,
        lossCarryforward: 0,
      };
      const result = calculateDepotLiquidationValue(
        [],
        100,
        30,
        taxState,
        0.26375,
      );
      expect(result.grossValue).toBe(0);
      expect(result.netLiquidityValue).toBe(0);
      expect(result.latentTax).toBe(0);
    });
  });
});

import { describe, it, expect } from "vitest";
import {
  calculateXirr,
  calculateBreakEvenAge,
  calculateDepotLiquidationValue,
  calculateInsuranceLiquidationValue,
  calculateImplicitRentenfaktor,
  calculateSimulationKPIs,
} from "../kpiMath";
import type { CombinedDataPoint } from "../../../types/simulation";
import type {
  GlobalParameters,
  DepotParameters,
  InsuranceParameters,
  TaxParameters,
  WithdrawalPlanParameters,
} from "../../../types/simulationParameters";

import { PRESET_SCENARIOS } from "../../../constants/scenarios";
import { simulateDepot } from "../../simulation/depot";
import { simulateInsurance } from "../../simulation/insurance";

describe("KPI Financial Mathematics (kpiMath)", () => {
  it("correctly matches chart retirement net liquidation values in basis scenario", () => {
    const basis = PRESET_SCENARIOS.find((s) => s.id === "basis")!.parameters;
    const global = basis.global as GlobalParameters;
    const depot = basis.depot as DepotParameters;
    const insurance = basis.insurance as InsuranceParameters;
    const tax = basis.tax as TaxParameters;
    const payout = basis.payout as WithdrawalPlanParameters;

    const dRes = simulateDepot(global, depot, tax, payout);
    const iRes = simulateInsurance(global, insurance, tax, payout);

    const accumulationMonths = (global.ageRetirement - global.ageStart) * 12;

    const fullHistory: CombinedDataPoint[] = dRes.history.map(
      (depPoint, index) => {
        const insPoint = iRes.history[index];
        return {
          month: depPoint.month,
          year: depPoint.year,
          phase:
            depPoint.phase ??
            (depPoint.month <= accumulationMonths ? "ACCUMULATION" : "PAYOUT"),
          investedCapital: depPoint.investedCapital,
          depotValue: depPoint.portfolioValue,
          depotValueNet: depPoint.netPortfolioValue,
          depotTotalCashInvested:
            depPoint.investedCapital + (depPoint.cumExternalTaxPaid || 0),
          depotGrossCashflow: depPoint.grossCashflow,
          depotNetCashflow: depPoint.netCashflow,
          depotFees: depPoint.feesPaid,
          depotTaxes: depPoint.taxesPaid,
          depotTaxAllowanceUsed: depPoint.taxAllowanceUsed || 0,
          insuranceValue: insPoint?.portfolioValue || 0,
          insuranceSurrenderValue:
            insPoint?.surrenderValue || insPoint?.portfolioValue || 0,
          insuranceValueNet: insPoint?.netPortfolioValue || 0,
          insuranceGrossCashflow: insPoint?.grossCashflow || 0,
          insuranceNetCashflow: insPoint?.netCashflow || 0,
          insuranceFees: insPoint?.feesPaid || 0,
          insuranceTaxes: insPoint?.taxesPaid || 0,
          insuranceTaxAllowanceUsed: insPoint?.taxAllowanceUsed || 0,
        };
      },
    );

    const kpis = calculateSimulationKPIs(
      fullHistory,
      global,
      depot,
      insurance,
      tax,
      payout,
    );

    // Net liquidation value at retirement entry matches the last month of accumulation (Month 420)
    const retirementPoint = fullHistory[419];
    expect(kpis.depotLiquidationValueAtRetirement).toBeCloseTo(
      retirementPoint.depotValueNet,
      2,
    );
    expect(kpis.insuranceLiquidationValueAtRetirement).toBeCloseTo(
      retirementPoint.insuranceValueNet,
      2,
    );
    expect(Math.round(kpis.depotLiquidationValueAtRetirement)).toBe(469469);
    expect(Math.round(kpis.insuranceLiquidationValueAtRetirement)).toBe(425096);
  });

  describe("calculateXirr", () => {
    it("calculates exact annualized IRR for a simple 1-year lump sum investment", () => {
      // Invest 1,000€ at month 0, receive 1,070€ at month 12 -> exactly 7% p.a.
      const cashflows = [
        { month: 0, amount: -1000 },
        { month: 12, amount: 1070 },
      ];
      const irr = calculateXirr(cashflows);
      expect(irr).toBeCloseTo(0.07, 4);
    });

    it("calculates annualized IRR for multi-year cash flow series", () => {
      // Invest 100€ monthly for 12 months, get back 1300€ at month 12
      const cashflows = [
        ...Array.from({ length: 12 }, (_, i) => ({ month: i, amount: -100 })),
        { month: 12, amount: 1300 },
      ];
      const irr = calculateXirr(cashflows);
      expect(irr).toBeGreaterThan(0.05);
      expect(irr).toBeLessThan(0.3);
    });

    it("handles negative IRR scenarios (portfolio loss)", () => {
      // Invest 10,000€ at month 0, receive 5,000€ at month 12 -> -50%
      const cashflows = [
        { month: 0, amount: -10000 },
        { month: 12, amount: 5000 },
      ];
      const irr = calculateXirr(cashflows);
      expect(irr).toBeCloseTo(-0.5, 4);
    });

    it("returns 0 for empty or one-sided cash flows", () => {
      expect(calculateXirr([])).toBe(0);
      expect(calculateXirr([{ month: 0, amount: -1000 }])).toBe(0);
      expect(
        calculateXirr([
          { month: 0, amount: 1000 },
          { month: 12, amount: 2000 },
        ]),
      ).toBe(0);
    });
  });

  describe("calculateBreakEvenAge", () => {
    it("detects the first month and exact age where insurance overtakes depot", () => {
      const history: CombinedDataPoint[] = [
        {
          month: 12,
          year: 1,
          phase: "PAYOUT",
          investedCapital: 100000,
          depotValue: 100000,
          depotValueNet: 100000,
          depotGrossCashflow: -2000,
          depotNetCashflow: -2000,
          depotFees: 0,
          depotTaxes: 0,
          depotTaxAllowanceUsed: 0,
          insuranceValue: 90000,
          insuranceValueNet: 90000,
          insuranceGrossCashflow: -2000,
          insuranceNetCashflow: -2000,
          insuranceFees: 0,
          insuranceTaxes: 0,
          insuranceTaxAllowanceUsed: 0,
        },
        {
          month: 24,
          year: 2,
          phase: "PAYOUT",
          investedCapital: 100000,
          depotValue: 50000,
          depotValueNet: 50000, // Depot depleted faster
          depotGrossCashflow: -2000,
          depotNetCashflow: -2000,
          depotFees: 0,
          depotTaxes: 0,
          depotTaxAllowanceUsed: 0,
          insuranceValue: 65000,
          insuranceValueNet: 65000, // Insurance higher!
          insuranceGrossCashflow: -2000,
          insuranceNetCashflow: -2000,
          insuranceFees: 0,
          insuranceTaxes: 0,
          insuranceTaxAllowanceUsed: 0,
        },
      ];

      const res = calculateBreakEvenAge(history, 65);
      expect(res.reached).toBe(true);
      expect(res.month).toBe(24);
      expect(res.ageYears).toBe(67);
      expect(res.ageMonths).toBe(0);
    });

    it("returns not reached if depot remains superior throughout", () => {
      const history: CombinedDataPoint[] = [
        {
          month: 12,
          year: 1,
          phase: "PAYOUT",
          investedCapital: 100000,
          depotValue: 120000,
          depotValueNet: 120000,
          depotGrossCashflow: -2000,
          depotNetCashflow: -2000,
          depotFees: 0,
          depotTaxes: 0,
          depotTaxAllowanceUsed: 0,
          insuranceValue: 80000,
          insuranceValueNet: 80000,
          insuranceGrossCashflow: -2000,
          insuranceNetCashflow: -2000,
          insuranceFees: 0,
          insuranceTaxes: 0,
          insuranceTaxAllowanceUsed: 0,
        },
      ];

      const res = calculateBreakEvenAge(history, 65);
      expect(res.reached).toBe(false);
      expect(res.ageYears).toBeNull();
      expect(res.month).toBeNull();
    });
  });

  describe("calculateDepotLiquidationValue", () => {
    it("correctly deducts capital gains tax with partial exemption and allowance", () => {
      // 200,000€ value, 100,000€ invested -> 100,000€ gain
      // 30% TFS -> 70,000€ taxable
      // 1,000€ allowance -> 69,000€ taxable
      // 26.375% tax -> 18,198.75€ tax
      // Net Liquidity: 200,000 - 18,198.75 = 181,801.25€
      const netVal = calculateDepotLiquidationValue(
        200000,
        100000,
        30,
        1000,
        0.26375,
      );
      expect(netVal).toBeCloseTo(181801.25, 2);
    });

    it("handles loss scenarios without negative taxes", () => {
      const netVal = calculateDepotLiquidationValue(
        80000,
        100000,
        30,
        1000,
        0.26375,
      );
      expect(netVal).toBe(80000);
    });
  });

  describe("calculateInsuranceLiquidationValue", () => {
    it("applies Halbeinkünfteverfahren when 12/62 rule is satisfied (duration >= 12 AND age >= 62)", () => {
      // 200,000€ value, 100,000€ invested -> 100,000€ profit
      // 12/62 met (duration 20y, age 65) -> 50% taxable
      // 15% TFS -> 100,000 * 0.5 * 0.85 = 42,500€
      // 1,000€ allowance -> 41,500€ taxable
      // 30% marginal tax rate -> 12,450€ tax
      // Net: 200,000 - 12,450 = 187,550€
      const netVal = calculateInsuranceLiquidationValue(
        200000,
        100000,
        15,
        true,
        20, // 20 years
        65, // age 65
        1000,
        30, // 30%
        0.26375,
      );
      expect(netVal).toBeCloseTo(187550, 2);
    });

    it("falls back to standard capital gains tax when 12/62 rule is NOT met (e.g. age < 62)", () => {
      // age 55 -> 12/62 fails
      // 100,000€ profit * 0.85 TFS = 85,000€
      // 1,000€ allowance -> 84,000€ taxable
      // 26.375% tax -> 22,155€ tax
      // Net: 200,000 - 22,155 = 177,845€
      const netVal = calculateInsuranceLiquidationValue(
        200000,
        100000,
        15,
        true,
        20,
        55, // age 55 < 62!
        1000,
        30,
        0.26375,
      );
      expect(netVal).toBeCloseTo(177845, 2);
    });
  });

  describe("calculateImplicitRentenfaktor", () => {
    it("calculates the correct rentenfaktor per 10,000 € capital", () => {
      // 2,000€ monthly payout from 500,000€ portfolio -> (2000 / 500000) * 10000 = 40.00
      expect(calculateImplicitRentenfaktor(2000, 500000)).toBeCloseTo(40.0, 2);
      expect(calculateImplicitRentenfaktor(1500, 300000)).toBeCloseTo(50.0, 2);
    });

    it("handles 0 capital gracefully", () => {
      expect(calculateImplicitRentenfaktor(2000, 0)).toBe(0);
      expect(calculateImplicitRentenfaktor(0, 500000)).toBe(0);
    });
  });

  describe("calculateSimulationKPIs", () => {
    it("orchestrates complete KPI dataset across accumulation and payout", () => {
      const globalParams: GlobalParameters = {
        ageStart: 30,
        ageRetirement: 65,
        initialCapital: 10000,
        monthlySavings: 500,
        savingsDynamicsPa: 0,
        savingsDynamicsLinkedToInflation: false,
        inflationRatePa: 2.0,
        marketReturnPa: 7.0,
        baseInterestRateAdvanceTax: 2.55,
        fundSwitchIntervalYears: 0,
      };

      const depotParams: DepotParameters = {
        trackingDifferencePa: 0.1,
        spreadPercent: 0.03,
        dividendYieldPa: 0,
        buyOrderFeeAbsolute: 0,
        buyOrderFeeRelative: 0,
        depotSellOrderFee: 1.0,
        depotFeePa: 0,
        partialTaxExemptionRate: 30,
        isAccumulating: true,
        advanceTaxFundingSource: "SELL_SHARES",
      };

      const insuranceParams: InsuranceParameters = {
        trackingDifferencePa: 0.2,
        alphaCostZillmerRate: 2.5,
        alphaCostRemainingRate: 0,
        alphaCostDurationYears: 5,
        betaCostContributionRate: 2.0,
        betaCostFixedPa: 24,
        adminCostCapitalPaAccumulation: 0.4,
        adminCostCapitalPaPayout: 0.4,
        surplusParticipationRatePa: 0.2,
        insurancePartialTaxExemptionRate: 15,
        halfIncomeProcedureActive: true,
        insuranceFundSwitchFee: 0,
        alphaCostSpecialPaymentRate: 2.5,
        betaCostSpecialPaymentRate: 1.75,
      };

      const taxParams: TaxParameters = {
        capitalGainsTaxRate: 25,
        solidaritySurchargeRate: 5.5,
        churchTaxRate: 0,
        marginalTaxRateRetirement: 28,
        taxAllowanceTotal: 1000,
        enableAdvanceTax: true,
      };

      const payoutParams: WithdrawalPlanParameters = {
        withdrawalType: "ABSOLUTE_AMOUNT",
        withdrawalValue: 2000,
        withdrawalDurationYears: 25,
        withdrawalIsNet: true,
        withdrawalInterval: "MONTHLY",
        withdrawalDynamicsPa: 0,
        withdrawalDynamicsLinkedToInflation: false,
        insuranceWithdrawalFeeRate: 0,
        insuranceWithdrawalFeeMaxAbsolute: 0,
      };

      const sampleHistory: CombinedDataPoint[] = [
        {
          month: 1,
          year: 1,
          phase: "ACCUMULATION",
          investedCapital: 10500,
          depotValue: 10550,
          depotValueNet: 10550,
          depotGrossCashflow: 500,
          depotNetCashflow: 500,
          depotFees: 0,
          depotTaxes: 0,
          depotTaxAllowanceUsed: 0,
          insuranceValue: 10300,
          insuranceValueNet: 10300,
          insuranceGrossCashflow: 500,
          insuranceNetCashflow: 480,
          insuranceFees: 20,
          insuranceTaxes: 0,
          insuranceTaxAllowanceUsed: 0,
        },
        {
          month: 420,
          year: 35,
          phase: "ACCUMULATION",
          investedCapital: 220000,
          depotValue: 800000,
          depotValueNet: 750000,
          depotGrossCashflow: 500,
          depotNetCashflow: 500,
          depotFees: 0,
          depotTaxes: 0,
          depotTaxAllowanceUsed: 0,
          insuranceValue: 720000,
          insuranceValueNet: 720000,
          insuranceGrossCashflow: 500,
          insuranceNetCashflow: 480,
          insuranceFees: 50,
          insuranceTaxes: 0,
          insuranceTaxAllowanceUsed: 0,
        },
        {
          month: 421,
          year: 36,
          phase: "PAYOUT",
          investedCapital: 220000,
          depotValue: 798000,
          depotValueNet: 748000,
          depotGrossCashflow: -2100,
          depotNetCashflow: -2000,
          depotFees: 1,
          depotTaxes: 99,
          depotTaxAllowanceUsed: 0,
          insuranceValue: 718000,
          insuranceValueNet: 718000,
          insuranceGrossCashflow: -2050,
          insuranceNetCashflow: -2000,
          insuranceFees: 0,
          insuranceTaxes: 50,
          insuranceTaxAllowanceUsed: 0,
        },
      ];

      const kpis = calculateSimulationKPIs(
        sampleHistory,
        globalParams,
        depotParams,
        insuranceParams,
        taxParams,
        payoutParams,
      );

      expect(kpis.depotTotalNetPayout).toBe(2000);
      expect(kpis.insuranceTotalNetPayout).toBe(2000);
      // Net liquidation values at retirement match the last accumulation month's exact net value
      expect(kpis.depotLiquidationValueAtRetirement).toBe(750000);
      expect(kpis.insuranceLiquidationValueAtRetirement).toBe(720000);
      expect(kpis.liquidationValueDiffAtRetirement).toBe(30000);
      // Rentenfaktor: (2000 / 750000) * 10000 ≈ 26.6667
      expect(kpis.depotImplicitRentenfaktor).toBeCloseTo(
        (2000 / 750000) * 10000,
        4,
      );
      // Rentenfaktor: (2000 / 720000) * 10000 ≈ 27.7778
      expect(kpis.insuranceImplicitRentenfaktor).toBeCloseTo(
        (2000 / 720000) * 10000,
        4,
      );
      expect(kpis.depotFinalValue).toBe(748000);
      expect(kpis.insuranceFinalValue).toBe(718000);
    });
  });
});

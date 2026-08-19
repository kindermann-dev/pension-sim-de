import { describe, it, expect } from "vitest";
import { simulateDepot } from "../depot";
import { simulateInsurance } from "../insurance";
import type {
  GlobalParameters,
  DepotParameters,
  TaxParameters,
  InsuranceParameters,
  WithdrawalPlanParameters,
} from "../../../types/simulationParameters";

describe("Simulation Engines", () => {
  const globalParams: GlobalParameters = {
    ageStart: 30,
    ageRetirement: 67,
    initialCapital: 0,
    monthlySavings: 250,
    savingsDynamicsPa: 2,
    savingsDynamicsLinkedToInflation: true,
    marketReturnPa: 7,
    inflationRatePa: 2,
    baseInterestRateAdvanceTax: 3.05,
    fundSwitchIntervalYears: 0,
  };

  const depotParams: DepotParameters = {
    trackingDifferencePa: 0.02,
    buyOrderFeeAbsolute: 0,
    buyOrderFeeRelative: 0,
    depotSellOrderFee: 1,
    spreadPercent: 0.03,
    depotFeePa: 0,
    partialTaxExemptionRate: 30,
    isAccumulating: true,
    dividendYieldPa: 0,
    advanceTaxFundingSource: "SELL_SHARES",
  };

  const taxParams: TaxParameters = {
    taxAllowanceTotal: 1000,
    capitalGainsTaxRate: 25,
    solidaritySurchargeRate: 5.5,
    churchTaxRate: 0,
    marginalTaxRateRetirement: 29,
    enableAdvanceTax: true,
  };

  const insuranceParams: InsuranceParameters = {
    alphaCostZillmerRate: 2.5,
    alphaCostDurationYears: 5,
    alphaCostRemainingRate: 1.0,
    betaCostContributionRate: 5.619,
    adminCostCapitalPaAccumulation: 0.2,
    adminCostCapitalPaPayout: 0.4,
    betaCostFixedPa: 0,
    trackingDifferencePa: 0.02,
    surplusParticipationRatePa: 0.0,
    insurancePartialTaxExemptionRate: 15,
    halfIncomeProcedureActive: true,
    insuranceFundSwitchFee: 0,
    alphaCostSpecialPaymentRate: 2.5,
    betaCostSpecialPaymentRate: 1.75,
  };

  const payoutParams: WithdrawalPlanParameters = {
    withdrawalInterval: "MONTHLY",
    withdrawalType: "ABSOLUTE_AMOUNT",
    withdrawalValue: 2000,
    withdrawalIsNet: true,
    withdrawalDurationYears: 25,
    withdrawalDynamicsPa: 2,
    withdrawalDynamicsLinkedToInflation: true,
    insuranceWithdrawalFeeRate: 1.0,
    insuranceWithdrawalFeeMaxAbsolute: 50.0,
  };

  const noPayout: WithdrawalPlanParameters = {
    ...payoutParams,
    withdrawalDurationYears: 0,
  };

  it("simulates accumulation phase for depot and insurance over 37 years (444 months)", () => {
    const depotAcc = simulateDepot(
      globalParams,
      depotParams,
      taxParams,
      noPayout,
    );
    const insAcc = simulateInsurance(
      globalParams,
      insuranceParams,
      taxParams,
      noPayout,
    );

    const totalMonths =
      (globalParams.ageRetirement - globalParams.ageStart) * 12;

    expect(depotAcc.history).toHaveLength(totalMonths);
    expect(insAcc.history).toHaveLength(totalMonths);

    // Both should have significant positive portfolios
    const finalDepot = depotAcc.history[depotAcc.history.length - 1];
    const finalIns = insAcc.history[insAcc.history.length - 1];

    expect(finalDepot?.portfolioValue).toBeGreaterThan(100000);
    expect(finalIns?.portfolioValue).toBeGreaterThan(100000);
  });

  it("simulates payout phase without crashing or NaN values", () => {
    const depotSim = simulateDepot(
      globalParams,
      depotParams,
      taxParams,
      payoutParams,
    );
    const insSim = simulateInsurance(
      globalParams,
      insuranceParams,
      taxParams,
      payoutParams,
    );

    const accumulationMonths =
      (globalParams.ageRetirement - globalParams.ageStart) * 12;
    const depotPayoutHistory = depotSim.history.slice(accumulationMonths);
    const insPayoutHistory = insSim.history.slice(accumulationMonths);

    expect(depotPayoutHistory.length).toBeGreaterThan(0);
    expect(insPayoutHistory.length).toBeGreaterThan(0);

    for (const point of depotPayoutHistory) {
      expect(Number.isFinite(point.netPortfolioValue)).toBe(true);
      expect(Number.isFinite(point.taxesPaid)).toBe(true);
      expect(Number.isFinite(point.grossCashflow)).toBe(true);
      // For non-January months (no advance tax settlement), gross withdrawal minus sell fees minus capital gains tax equals net cashflow
      if (point.grossCashflow < 0 && (point.month - 1) % 12 !== 0) {
        const grossAbs = Math.abs(point.grossCashflow);
        const netAbs = Math.abs(point.netCashflow);
        expect(grossAbs - point.feesPaid - point.taxesPaid).toBeCloseTo(
          netAbs,
          2,
        );
      }
    }

    for (const point of insPayoutHistory) {
      expect(Number.isFinite(point.netPortfolioValue)).toBe(true);
      expect(Number.isFinite(point.taxesPaid)).toBe(true);
      expect(Number.isFinite(point.grossCashflow)).toBe(true);
    }
  });

  it("calculates and charges German advance tax in January (first month of new year) according to § 18 Abs. 1 InvStG", () => {
    // Large initial capital with low tax allowance to trigger advance tax
    const largeCapitalGlobal: GlobalParameters = {
      ...globalParams,
      initialCapital: 200000,
      monthlySavings: 0,
      marketReturnPa: 6.0,
      baseInterestRateAdvanceTax: 3.0,
    };
    const lowAllowanceTax: TaxParameters = {
      ...taxParams,
      taxAllowanceTotal: 0, // No allowance => full advance tax paid
      enableAdvanceTax: true,
    };

    const depotAcc = simulateDepot(
      largeCapitalGlobal,
      depotParams,
      lowAllowanceTax,
      noPayout,
    );

    // Month 1..12 (Year 1): No advance tax in Year 1
    for (let m = 1; m <= 12; m++) {
      expect(depotAcc.history[m - 1]?.taxesPaid).toBe(0);
    }

    // Month 13 (January of Year 2): Advance tax for Year 1 must be paid
    const month13 = depotAcc.history[12];
    expect(month13?.taxesPaid).toBeGreaterThan(0);

    // Month 14..24 (Year 2): No advance tax until month 25
    for (let m = 14; m <= 24; m++) {
      expect(depotAcc.history[m - 1]?.taxesPaid).toBe(0);
    }

    // Month 25 (January of Year 3): Advance tax for Year 2 must be paid
    const month25 = depotAcc.history[24];
    expect(month25?.taxesPaid).toBeGreaterThan(0);
  });

  it("correctly uses inflationRatePa for savings and withdrawal dynamics when coupled", () => {
    const customGlobal: GlobalParameters = {
      ...globalParams,
      inflationRatePa: 3.5,
      savingsDynamicsPa: 1.0, // Should be ignored when linked
      savingsDynamicsLinkedToInflation: true,
      monthlySavings: 1000,
    };

    const resultLinked = simulateDepot(
      customGlobal,
      depotParams,
      taxParams,
      noPayout,
    );

    // Month 13 (Year 2, month 1) should have savings of 1000 * 1.035 = 1035
    const month13Point = resultLinked.history[12];
    expect(month13Point?.grossCashflow).toBeCloseTo(1035, 2);

    const customGlobalUnlinked: GlobalParameters = {
      ...customGlobal,
      savingsDynamicsLinkedToInflation: false,
    };

    const resultUnlinked = simulateDepot(
      customGlobalUnlinked,
      depotParams,
      taxParams,
      noPayout,
    );

    // Month 13 should have savings of 1000 * 1.01 = 1010
    const month13PointUnlinked = resultUnlinked.history[12];
    expect(month13PointUnlinked?.grossCashflow).toBeCloseTo(1010, 2);
  });

  it("handles empty portfolio edge case (0 initial capital and 0 monthly savings)", () => {
    const emptyGlobal: GlobalParameters = {
      ...globalParams,
      initialCapital: 0,
      monthlySavings: 0,
    };

    const depotSim = simulateDepot(
      emptyGlobal,
      depotParams,
      taxParams,
      payoutParams,
    );
    const insSim = simulateInsurance(
      emptyGlobal,
      insuranceParams,
      taxParams,
      payoutParams,
    );

    expect(depotSim.state.totalValue).toBe(0);
    expect(insSim.state.totalValue).toBe(0);

    const accumulationMonths =
      (emptyGlobal.ageRetirement - emptyGlobal.ageStart) * 12;
    expect(depotSim.history).toHaveLength(accumulationMonths + 1);
    expect(depotSim.history.every((p) => p.portfolioValue === 0)).toBe(true);
    expect(insSim.history.every((p) => p.portfolioValue === 0)).toBe(true);
  });

  it("handles 0% and negative market returns without failure", () => {
    const zeroReturnGlobal: GlobalParameters = {
      ...globalParams,
      marketReturnPa: 0,
      initialCapital: 10000,
      monthlySavings: 100,
    };

    const depotZero = simulateDepot(
      zeroReturnGlobal,
      depotParams,
      taxParams,
      noPayout,
    );
    expect(depotZero.state.totalValue).toBeGreaterThan(0);
    expect(depotZero.state.totalTaxPaid).toBe(0); // 0 return => 0 advance tax

    const negativeReturnGlobal: GlobalParameters = {
      ...globalParams,
      marketReturnPa: -5,
      initialCapital: 10000,
      monthlySavings: 100,
    };

    const depotNeg = simulateDepot(
      negativeReturnGlobal,
      depotParams,
      taxParams,
      noPayout,
    );
    expect(depotNeg.state.totalValue).toBeGreaterThan(0);
    expect(depotNeg.state.totalTaxPaid).toBe(0); // Loss => 0 advance tax
  });

  it("handles rapid portfolio depletion in payout phase and terminates cleanly", () => {
    // Start with small capital and large withdrawal
    const smallGlobal: GlobalParameters = {
      ...globalParams,
      initialCapital: 1000,
      monthlySavings: 0,
      ageStart: 60,
      ageRetirement: 61, // 1 year accumulation
    };

    const heavyPayout: WithdrawalPlanParameters = {
      ...payoutParams,
      withdrawalValue: 5000, // Demands 5000€ per month from ~1000€ portfolio
      withdrawalDurationYears: 20,
    };

    const depotSim = simulateDepot(
      smallGlobal,
      depotParams,
      taxParams,
      heavyPayout,
    );
    const insSim = simulateInsurance(
      smallGlobal,
      insuranceParams,
      taxParams,
      heavyPayout,
    );

    // 12 months accumulation + 1 month payout before depletion = 13 months total
    expect(depotSim.history.length).toBe(13);
    expect(depotSim.state.totalValue).toBe(0);
    expect(insSim.history.length).toBe(13);
    expect(insSim.state.totalValue).toBe(0);
  });

  it("supports yearly withdrawal intervals", () => {
    const yearlyPayout: WithdrawalPlanParameters = {
      ...payoutParams,
      withdrawalInterval: "YEARLY",
      withdrawalValue: 24000, // 24k once a year
      withdrawalDurationYears: 5,
    };

    const depotSim = simulateDepot(
      globalParams,
      depotParams,
      taxParams,
      yearlyPayout,
    );
    const accumulationMonths =
      (globalParams.ageRetirement - globalParams.ageStart) * 12;

    // Only payout months 12, 24, 36, 48, 60 should have non-zero gross cashflow
    const nonWithdrawalMonth = depotSim.history[accumulationMonths]; // month 1 of payout
    const withdrawalMonth = depotSim.history[accumulationMonths + 11]; // month 12 of payout

    expect(nonWithdrawalMonth?.grossCashflow).toBe(0);
    expect(withdrawalMonth?.grossCashflow).toBeLessThan(0);
  });

  it("supports gross withdrawal mode (withdrawalIsNet: false)", () => {
    const grossPayout: WithdrawalPlanParameters = {
      ...payoutParams,
      withdrawalValue: 2000,
      withdrawalIsNet: false,
      withdrawalDurationYears: 5,
    };

    const depotSim = simulateDepot(
      globalParams,
      depotParams,
      taxParams,
      grossPayout,
    );
    const insSim = simulateInsurance(
      globalParams,
      insuranceParams,
      taxParams,
      grossPayout,
    );

    const accumulationMonths =
      (globalParams.ageRetirement - globalParams.ageStart) * 12;
    const firstPayoutMonthDepot = depotSim.history[accumulationMonths];
    const firstPayoutMonthIns = insSim.history[accumulationMonths];

    // In gross mode, actualGrossWithdrawal is exactly 2000€
    expect(firstPayoutMonthDepot?.grossCashflow).toBe(-2000);
    expect(firstPayoutMonthIns?.grossCashflow).toBe(-2000);
    // Net cashflow is less than 2000 due to fees/taxes
    expect(Math.abs(firstPayoutMonthDepot?.netCashflow ?? 0)).toBeLessThan(
      2000,
    );
  });

  it("supports disabling German advance tax (enableAdvanceTax: false)", () => {
    const taxNoAdvance: TaxParameters = {
      ...taxParams,
      enableAdvanceTax: false,
    };

    const depotAcc = simulateDepot(
      globalParams,
      depotParams,
      taxNoAdvance,
      noPayout,
    );
    expect(depotAcc.state.totalTaxPaid).toBe(0);
  });

  it("supports insurance without Halbeinkünfteverfahren (halfIncomeProcedureActive: false)", () => {
    const noHalbeinkuenfte: InsuranceParameters = {
      ...insuranceParams,
      halfIncomeProcedureActive: false,
    };

    const insSim = simulateInsurance(
      globalParams,
      noHalbeinkuenfte,
      taxParams,
      payoutParams,
    );
    const accumulationMonths =
      (globalParams.ageRetirement - globalParams.ageStart) * 12;
    const insPayoutHistory = insSim.history.slice(accumulationMonths);
    expect(insPayoutHistory.length).toBeGreaterThan(0);
    // Taxes paid with standard Abgeltungsteuer should be non-zero
    const totalTaxes = insPayoutHistory.reduce(
      (sum, p) => sum + p.taxesPaid,
      0,
    );
    expect(totalTaxes).toBeGreaterThan(0);
  });

  it("correctly taxes fund switches in ETF depot while keeping them tax-free in insurance", () => {
    const switchParams: GlobalParameters = {
      ...globalParams,
      ageStart: 30,
      ageRetirement: 50, // 20 years = 240 months
      fundSwitchIntervalYears: 10, // Switch at month 120
      initialCapital: 20000,
      monthlySavings: 500,
      marketReturnPa: 8.0,
    };

    const depotWithSwitch = simulateDepot(
      switchParams,
      depotParams,
      taxParams,
      noPayout,
    );
    const insWithSwitch = simulateInsurance(
      switchParams,
      insuranceParams,
      taxParams,
      noPayout,
    );

    // Month 120 in Depot must trigger full capital gains tax on the switch
    const month120Depot = depotWithSwitch.history[119];
    expect(month120Depot?.taxesPaid).toBeGreaterThan(1000);
    expect(month120Depot?.taxBreakdown?.title).toContain("Fondswechsel");

    // Month 120 in Insurance must be 100% tax-free
    const month120Ins = insWithSwitch.history[119];
    expect(month120Ins?.taxesPaid).toBe(0);
    expect(month120Ins?.taxBreakdown?.title).toContain("Steuer");
  });

  it("differentiates gross portfolioValue from netPortfolioValue when unrealized profits exist", () => {
    const growthParams: GlobalParameters = {
      ...globalParams,
      ageStart: 30,
      ageRetirement: 50, // 20 years
      initialCapital: 50000,
      monthlySavings: 500,
      marketReturnPa: 8.0,
    };

    const depotSim = simulateDepot(
      growthParams,
      depotParams,
      taxParams,
      payoutParams,
    );
    const insSim = simulateInsurance(
      growthParams,
      insuranceParams,
      taxParams,
      payoutParams,
    );

    const accumulationMonths =
      (growthParams.ageRetirement - growthParams.ageStart) * 12; // 240

    // Final accumulation month: Large unrealized gains exist
    const finalDepotMonth = depotSim.history[accumulationMonths - 1];
    const finalInsMonth = insSim.history[accumulationMonths - 1];

    expect(finalDepotMonth).toBeDefined();
    expect(finalInsMonth).toBeDefined();

    // Gross depot value must be strictly greater than net depot value (latent capital gains tax exists)
    expect(finalDepotMonth!.portfolioValue).toBeGreaterThan(
      finalDepotMonth!.netPortfolioValue,
    );
    // Difference is approximately the latent capital gains tax after 30% TFS
    const depotLatentTax =
      finalDepotMonth!.portfolioValue - finalDepotMonth!.netPortfolioValue;
    expect(depotLatentTax).toBeGreaterThan(1000);

    // Gross insurance value must be strictly greater than net surrender value
    expect(finalInsMonth!.portfolioValue).toBeGreaterThan(
      finalInsMonth!.netPortfolioValue,
    );

    // In payout phase, netPortfolioValue also reflects remaining net wealth
    const firstPayoutMonth = depotSim.history[accumulationMonths];
    expect(firstPayoutMonth).toBeDefined();
    expect(firstPayoutMonth!.portfolioValue).toBeGreaterThan(
      firstPayoutMonth!.netPortfolioValue,
    );
  });

  it("simulates full lifecycle with simulateDepot across accumulation and payout seamlessly", () => {
    const fullLifecycle = simulateDepot(
      globalParams,
      depotParams,
      taxParams,
      payoutParams,
    );
    const accumulationMonths =
      (globalParams.ageRetirement - globalParams.ageStart) * 12; // 444
    const payoutMonths = payoutParams.withdrawalDurationYears * 12; // 300
    const totalExpectedMonths = accumulationMonths + payoutMonths; // 744

    expect(fullLifecycle.history).toHaveLength(totalExpectedMonths);

    // Accumulation phase assertions
    const accPoints = fullLifecycle.history.slice(0, accumulationMonths);
    expect(accPoints.every((p) => p.phase === "ACCUMULATION")).toBe(true);
    expect(accPoints.every((p) => p.grossCashflow >= 0)).toBe(true);

    // Payout phase assertions
    const payoutPoints = fullLifecycle.history.slice(accumulationMonths);
    expect(payoutPoints.every((p) => p.phase === "PAYOUT")).toBe(true);
    expect(payoutPoints.every((p) => p.grossCashflow <= 0)).toBe(true);

    // Month 445 (first payout month) should have withdrawal
    const month445 = fullLifecycle.history[accumulationMonths];
    expect(month445).toBeDefined();
    expect(month445!.grossCashflow).toBeLessThan(0);
    expect(month445!.netCashflow).toBeLessThan(0);
  });

  it("simulates full lifecycle with simulateInsurance across accumulation and payout seamlessly", () => {
    const fullLifecycle = simulateInsurance(
      globalParams,
      insuranceParams,
      taxParams,
      payoutParams,
    );
    const accumulationMonths =
      (globalParams.ageRetirement - globalParams.ageStart) * 12; // 444
    const payoutMonths = payoutParams.withdrawalDurationYears * 12; // 300
    const totalExpectedMonths = accumulationMonths + payoutMonths; // 744

    expect(fullLifecycle.history).toHaveLength(totalExpectedMonths);

    // Accumulation phase assertions
    const accPoints = fullLifecycle.history.slice(0, accumulationMonths);
    expect(accPoints.every((p) => p.phase === "ACCUMULATION")).toBe(true);
    expect(accPoints.every((p) => p.grossCashflow >= 0)).toBe(true);
    // 0 advance tax during accumulation in insurance
    expect(accPoints.every((p) => p.taxesPaid === 0)).toBe(true);

    // Payout phase assertions
    const payoutPoints = fullLifecycle.history.slice(accumulationMonths);
    expect(payoutPoints.every((p) => p.phase === "PAYOUT")).toBe(true);
    expect(payoutPoints.every((p) => p.grossCashflow <= 0)).toBe(true);

    // First payout month should have withdrawal
    const firstPayoutMonth = fullLifecycle.history[accumulationMonths];
    expect(firstPayoutMonth).toBeDefined();
    expect(firstPayoutMonth!.grossCashflow).toBeLessThan(0);
    expect(firstPayoutMonth!.netCashflow).toBeLessThan(0);
  });

  describe("advanceTaxFundingSource (SELL_SHARES vs. EXTERNAL_CASH)", () => {
    const largeCapitalGlobal: GlobalParameters = {
      ...globalParams,
      initialCapital: 100000,
      monthlySavings: 0,
      marketReturnPa: 8.0,
      baseInterestRateAdvanceTax: 3.0,
      ageStart: 30,
      ageRetirement: 33, // 3 years = 36 months
    };

    const zeroAllowanceTax: TaxParameters = {
      ...taxParams,
      taxAllowanceTotal: 0,
      enableAdvanceTax: true,
    };

    it("settles advance tax by redeeming shares when advanceTaxFundingSource is SELL_SHARES", () => {
      const depotParamsSell: DepotParameters = {
        ...depotParams,
        advanceTaxFundingSource: "SELL_SHARES",
      };

      const result = simulateDepot(
        largeCapitalGlobal,
        depotParamsSell,
        zeroAllowanceTax,
        noPayout,
      );

      // Month 13 (January Year 2) has advance tax
      const month13 = result.history[12];
      expect(month13?.taxesPaid).toBeGreaterThan(0);
      // External tax paid must remain 0 because tax was funded by selling shares
      expect(month13?.cumExternalTaxPaid).toBe(0);
      expect(result.state.totalExternalTaxPaid ?? 0).toBe(0);
      expect(
        month13?.taxBreakdown?.rows.some(
          (r) =>
            r.label === "Begleichung" && r.value.includes("Anteilsverkauf"),
        ),
      ).toBe(true);
    });

    it("settles advance tax by external cash from clearing account when advanceTaxFundingSource is EXTERNAL_CASH", () => {
      const depotParamsExternal: DepotParameters = {
        ...depotParams,
        advanceTaxFundingSource: "EXTERNAL_CASH",
      };

      const result = simulateDepot(
        largeCapitalGlobal,
        depotParamsExternal,
        zeroAllowanceTax,
        noPayout,
      );

      // Month 13 (January Year 2) has advance tax
      const month13 = result.history[12];
      expect(month13?.taxesPaid).toBeGreaterThan(0);
      // External tax paid must be greater than 0
      expect(month13?.cumExternalTaxPaid).toBeGreaterThan(0);
      expect(result.state.totalExternalTaxPaid).toBeGreaterThan(0);
      expect(
        month13?.taxBreakdown?.rows.some(
          (r) => r.label === "Begleichung" && r.value.includes("Girokonto"),
        ),
      ).toBe(true);
    });

    it("settles advance tax by external cash in depot and matches with equal gross special payment in insurance when MATCHED_POLICE_CONTRIBUTION is active", () => {
      const depotParamsMatched: DepotParameters = {
        ...depotParams,
        advanceTaxFundingSource: "MATCHED_POLICE_CONTRIBUTION",
      };

      const insuranceParamsMatched: InsuranceParameters = {
        ...insuranceParams,
        alphaCostSpecialPaymentRate: 2.5,
        betaCostSpecialPaymentRate: 1.75,
      };

      const depotResult = simulateDepot(
        largeCapitalGlobal,
        depotParamsMatched,
        zeroAllowanceTax,
        noPayout,
      );
      const matchedSpecialContributions = depotResult.history
        .filter((p) => p.phase === "ACCUMULATION" && p.taxesPaid > 0)
        .map((p) => ({ month: p.month, amount: p.taxesPaid }));

      expect(matchedSpecialContributions.length).toBeGreaterThan(0);

      const insResult = simulateInsurance(
        largeCapitalGlobal,
        insuranceParamsMatched,
        zeroAllowanceTax,
        noPayout,
        matchedSpecialContributions,
      );

      // In month 13 (January Year 2)
      const depotMonth13 = depotResult.history[12]!;
      const insMonth13 = insResult.history[12]!;

      expect(depotMonth13.taxesPaid).toBeGreaterThan(0);
      expect(insMonth13.grossCashflow).toBe(depotMonth13.taxesPaid); // savings is 0, so grossCashflow is exactly the Zuzahlung

      // Fee breakdown in insurance should include Alpha Zuzahlung and Beta Zuzahlung
      const alphaRow = insMonth13.feeBreakdown?.rows.find((r) =>
        r.label.includes("Alpha Zuzahlung"),
      );
      const betaRow = insMonth13.feeBreakdown?.rows.find((r) =>
        r.label.includes("Beta Zuzahlung"),
      );
      expect(alphaRow).toBeDefined();
      expect(betaRow).toBeDefined();

      // Total cash invested equality across entire accumulation
      const finalDepot = depotResult.history[depotResult.history.length - 1]!;
      const finalIns = insResult.history[insResult.history.length - 1]!;

      const totalCashDepot =
        finalDepot.investedCapital + (finalDepot.cumExternalTaxPaid ?? 0);
      const totalCashIns = finalIns.investedCapital;

      // Both must be exactly identical to the cent (100% budget equality!)
      expect(totalCashDepot).toBeCloseTo(totalCashIns, 2);
    });
  });
});

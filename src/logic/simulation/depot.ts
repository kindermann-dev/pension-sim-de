import type {
  GlobalParameters,
  DepotParameters,
  TaxParameters,
  WithdrawalPlanParameters,
} from "../../types/simulationParameters";
import type {
  DepotState,
  LifecycleDataPoint,
  DetailBreakdown,
} from "../../types/simulation";
import {
  calculateMonthlyReturnRate,
  calculateNetInvestment,
  calculateSharesToBuy,
  applyDynamics,
  calculateEffectiveCapitalGainsTaxRate,
  calculatePricePerformance,
  calculateTaxWithAllowance,
  formatCurrency,
} from "../math/commonMath";
import {
  calculateAdvanceYieldsAndUpdateTranches,
  calculateDepotNetValue,
  sellDepotShares,
  sellDepotSharesFIFO,
  sellAllDepotShares,
  calculateDepotValue,
} from "../math/depotMath";
import { findRequiredGrossForTargetNet } from "../math/payoutMath";

function settleJanuaryAdvanceTax(
  state: DepotState,
  settledMonth: number,
  globalParams: GlobalParameters,
  depotParams: DepotParameters,
  taxParams: TaxParameters,
  currentTaxAllowance: number,
  effectiveTaxRate: number,
): {
  taxAmount: number;
  consumedAllowance: number;
  newTaxAllowance: number;
  taxBreakdown: DetailBreakdown | null;
} {
  if (
    !taxParams.enableAdvanceTax ||
    !depotParams.isAccumulating ||
    state.tranches.length === 0
  ) {
    return {
      taxAmount: 0,
      consumedAllowance: 0,
      newTaxAllowance: currentTaxAllowance,
      taxBreakdown: null,
    };
  }

  const advanceResult = calculateAdvanceYieldsAndUpdateTranches(
    state.tranches,
    state.prevYearStartPrice,
    state.prevYearEndPrice,
    settledMonth,
    globalParams.baseInterestRateAdvanceTax,
  );

  state.tranches = advanceResult.updatedTranches;

  const taxResult = calculateTaxWithAllowance(
    advanceResult.totalAdvanceYield,
    depotParams.partialTaxExemptionRate,
    currentTaxAllowance,
    effectiveTaxRate,
  );

  const taxAmount = taxResult.taxAmount;
  const consumedAllowance = taxResult.consumedAllowance;
  const newTaxAllowance = currentTaxAllowance - consumedAllowance;
  state.totalTaxPaid += taxAmount;

  const fundingSource = depotParams.advanceTaxFundingSource ?? "SELL_SHARES";
  let fundingLabel = "Anteilsverkauf im Depot (Budget-Gleichheit)";

  if (taxAmount > 0) {
    if (fundingSource === "SELL_SHARES") {
      // Settle advance tax by redeeming fund shares from depot
      const sellResult = sellDepotSharesFIFO(
        state.tranches,
        taxAmount,
        state.currentSharePrice,
      );
      state.tranches = sellResult.updatedTranches;
      state.totalValue = calculateDepotValue(
        state.currentSharePrice,
        state.tranches,
      );
      fundingLabel = `Anteilsverkauf (${(taxAmount / state.currentSharePrice).toFixed(4)} Anteile)`;
    } else {
      // Settle advance tax by external cash from clearing account
      state.totalExternalTaxPaid =
        (state.totalExternalTaxPaid ?? 0) + taxAmount;
      fundingLabel =
        fundingSource === "MATCHED_POLICE_CONTRIBUTION"
          ? "Zahlung vom Girokonto + Zuzahlung in Police"
          : "Zahlung vom Girokonto (Out-of-Pocket)";
    }
  }

  const taxableAfterPartialExemption = taxResult.taxableAfterTFS;

  const taxBreakdown: DetailBreakdown = {
    title: "Vorabpauschale (§ 18 InvStG)",
    rows: [
      {
        label: "Basisertrag",
        value: formatCurrency(advanceResult.totalAdvanceYield),
      },
      {
        label: `nach Teilfreistellung (${100 - depotParams.partialTaxExemptionRate}% TFS)`,
        value: formatCurrency(taxableAfterPartialExemption),
      },
      ...(consumedAllowance > 0
        ? [
            {
              label: "Freibetrag (FSA) genutzt",
              value: `- ${formatCurrency(consumedAllowance)}`,
            },
          ]
        : []),
      {
        label: "Zu versteuern",
        value: formatCurrency(taxResult.taxableAfterAllowance),
      },
      {
        label: "Effektiver Steuersatz",
        value: `× ${(effectiveTaxRate * 100).toFixed(2)}%`,
      },
      {
        label: "Steuer Vorabpauschale",
        value: formatCurrency(taxAmount),
        isTotal: true,
      },
      ...(taxAmount > 0 ? [{ label: "Begleichung", value: fundingLabel }] : []),
    ],
  };

  return { taxAmount, consumedAllowance, newTaxAllowance, taxBreakdown };
}

/**
 * Simulates the entire ETF depot lifecycle (accumulation and payout phases)
 * in a single unified monthly discrete-time loop.
 */
export function simulateDepot(
  globalParams: GlobalParameters,
  depotParams: DepotParameters,
  taxParams: TaxParameters,
  payoutParams: WithdrawalPlanParameters,
): { state: DepotState; history: LifecycleDataPoint[] } {
  // init constants
  const accumulationYears = globalParams.ageRetirement - globalParams.ageStart;
  const accumulationMonths = accumulationYears * 12;
  const payoutYears = payoutParams.withdrawalDurationYears;
  const payoutMonths = payoutYears * 12;
  const totalMonths = accumulationMonths + payoutMonths;

  const netAnnualReturnPercent =
    globalParams.marketReturnPa - depotParams.trackingDifferencePa;
  const monthlyReturnRate = calculateMonthlyReturnRate(netAnnualReturnPercent);
  const effectiveRelativeFee =
    depotParams.buyOrderFeeRelative + depotParams.spreadPercent / 2;
  const effectiveTaxRate = calculateEffectiveCapitalGainsTaxRate(
    taxParams.capitalGainsTaxRate,
    taxParams.solidaritySurchargeRate,
    taxParams.churchTaxRate,
  );

  // init variables
  let currentSavingsRate = globalParams.monthlySavings;
  let currentGrossWithdrawal = payoutParams.withdrawalValue;
  let yearlyTaxAllowance = taxParams.taxAllowanceTotal;

  const state: DepotState = {
    currentSharePrice: 100,
    tranches: [],
    totalInvested: 0,
    totalValue: 0,
    totalTaxPaid: 0,
    prevYearStartPrice: 100,
    prevYearEndPrice: 100,
  };

  const history: LifecycleDataPoint[] = [];

  // initial capital
  if (globalParams.initialCapital > 0) {
    const netInitial = calculateNetInvestment(
      globalParams.initialCapital,
      depotParams.buyOrderFeeAbsolute,
      effectiveRelativeFee,
    );

    state.tranches.push({
      month: 0,
      shares: calculateSharesToBuy(netInitial, state.currentSharePrice),
      purchasePricePerShare: state.currentSharePrice,
      accumulatedAdvanceYieldPerShare: 0,
    });
    state.totalInvested += globalParams.initialCapital;
    state.totalValue = netInitial;
  }

  // main lifecycle loop
  for (let month = 1; month <= totalMonths; month++) {
    const isAccumulation = month <= accumulationMonths;
    const phase: "ACCUMULATION" | "PAYOUT" = isAccumulation
      ? "ACCUMULATION"
      : "PAYOUT";

    let advanceTaxAmount = 0;
    let advanceTaxBreakdown: DetailBreakdown | null = null;
    let transactionTax = 0;

    let grossCashflow = 0;
    let netCashflow = 0;
    let totalFees = 0;

    let feeBreakdown: DetailBreakdown = {
      title: "Depotgebühren",
      rows: [{ label: "Status", value: "Keine Gebühren" }],
    };
    let taxBreakdown: DetailBreakdown = {
      title: "Steuer",
      rows: [{ label: "Status", value: "Keine Steuer fällig" }],
    };

    // first month of a new calendar year (January, starting in Year 2 / month 13, 25, 37...)
    if (month > 1 && (month - 1) % 12 === 0) {
      if (isAccumulation) {
        const effectiveSavingsDynamics =
          globalParams.savingsDynamicsLinkedToInflation
            ? globalParams.inflationRatePa
            : globalParams.savingsDynamicsPa;
        currentSavingsRate = applyDynamics(
          currentSavingsRate,
          effectiveSavingsDynamics,
        );
      } else {
        const payoutMonth = month - accumulationMonths;
        if (payoutMonth > 1) {
          const effectiveWithdrawalDynamics =
            payoutParams.withdrawalDynamicsLinkedToInflation
              ? globalParams.inflationRatePa
              : payoutParams.withdrawalDynamicsPa;
          currentGrossWithdrawal = applyDynamics(
            currentGrossWithdrawal,
            effectiveWithdrawalDynamics,
          );
        }
      }

      yearlyTaxAllowance = taxParams.taxAllowanceTotal;

      // advance tax (Vorabpauschale) for preceding year deemed accrued on January 1st (§ 18 Abs. 1 InvStG)
      const advanceSettlement = settleJanuaryAdvanceTax(
        state,
        month - 1,
        globalParams,
        depotParams,
        taxParams,
        yearlyTaxAllowance,
        effectiveTaxRate,
      );

      advanceTaxAmount = advanceSettlement.taxAmount;
      yearlyTaxAllowance = advanceSettlement.newTaxAllowance;
      advanceTaxBreakdown = advanceSettlement.taxBreakdown;

      state.prevYearStartPrice = state.prevYearEndPrice;
    }

    if (isAccumulation) {
      // ACCUMULATION PHASE
      let netInvestment = 0;
      let orderCost = 0;

      if (currentSavingsRate > 0) {
        netInvestment = calculateNetInvestment(
          currentSavingsRate,
          depotParams.buyOrderFeeAbsolute,
          effectiveRelativeFee,
        );

        const sharesBought = calculateSharesToBuy(
          netInvestment,
          state.currentSharePrice,
        );
        state.tranches.push({
          month,
          shares: sharesBought,
          purchasePricePerShare: state.currentSharePrice,
          accumulatedAdvanceYieldPerShare: 0,
        });

        state.totalInvested += currentSavingsRate;
        orderCost = currentSavingsRate - netInvestment;
      }

      grossCashflow = currentSavingsRate;
      netCashflow = netInvestment;

      // price performance
      state.currentSharePrice = calculatePricePerformance(
        state.currentSharePrice,
        monthlyReturnRate,
      );
      state.totalValue = calculateDepotValue(
        state.currentSharePrice,
        state.tranches,
      );

      // Fund Switch (Fondswechsel / Umschichtung) inside Depot
      let switchFeesPaid = 0;
      const isFundSwitchMonth =
        globalParams.fundSwitchIntervalYears > 0 &&
        month % (globalParams.fundSwitchIntervalYears * 12) === 0 &&
        month < accumulationMonths &&
        state.totalValue > 0;

      if (isFundSwitchMonth) {
        const preSwitchValue = state.totalValue;
        const sellResult = sellAllDepotShares(
          state.tranches,
          state.currentSharePrice,
          depotParams.partialTaxExemptionRate,
          yearlyTaxAllowance,
          effectiveTaxRate,
          depotParams.depotSellOrderFee,
          depotParams.spreadPercent,
        );

        state.tranches = sellResult.updatedTranches;
        yearlyTaxAllowance -= sellResult.consumedAllowance;
        transactionTax = sellResult.taxAmount;
        state.totalTaxPaid += transactionTax;

        const sellOrderFee = sellResult.effectiveSellFee;
        const buyOrderFee =
          depotParams.buyOrderFeeAbsolute +
          sellResult.netWithdrawal * (depotParams.buyOrderFeeRelative / 100) +
          sellResult.netWithdrawal * (depotParams.spreadPercent / 2 / 100);

        const netReinvested = Math.max(
          0,
          sellResult.netWithdrawal - buyOrderFee,
        );
        switchFeesPaid = sellOrderFee + buyOrderFee;

        // Reinvest in new single tranche
        const newShares = netReinvested / state.currentSharePrice;
        state.tranches = [
          {
            month,
            shares: newShares,
            purchasePricePerShare: state.currentSharePrice,
            accumulatedAdvanceYieldPerShare: 0,
          },
        ];
        state.totalValue = netReinvested;

        taxBreakdown = {
          title: "Fondswechsel (Vollversteuerung im Depot)",
          rows: [
            {
              label: "Umschichtungsvolumen",
              value: formatCurrency(preSwitchValue),
            },
            {
              label: "Realisierter Gewinn",
              value: formatCurrency(sellResult.taxableGain),
            },
            {
              label: `nach Teilfreistellung (${100 - depotParams.partialTaxExemptionRate}% TFS)`,
              value: formatCurrency(sellResult.taxableAfterExemption),
            },
            ...(sellResult.consumedAllowance > 0
              ? [
                  {
                    label: "FSA genutzt",
                    value: `- ${formatCurrency(sellResult.consumedAllowance)}`,
                  },
                ]
              : []),
            {
              label: "Zu versteuern",
              value: formatCurrency(sellResult.taxableAfterAllowance),
            },
            {
              label: "Steuersatz",
              value: `× ${(effectiveTaxRate * 100).toFixed(2)}%`,
            },
            {
              label: "Abgeltungsteuer auf Fondswechsel",
              value: formatCurrency(sellResult.taxAmount),
              isTotal: true,
            },
          ],
        };
      } else if (advanceTaxBreakdown) {
        taxBreakdown = advanceTaxBreakdown;
      }

      const effectiveDepotFeeMonthly = depotParams.depotFeePa / 12;
      totalFees = orderCost + effectiveDepotFeeMonthly + switchFeesPaid;

      const feeRows = [];
      if (orderCost > 0) {
        feeRows.push({
          label: `Kaufgebühr + Spread (${effectiveRelativeFee.toFixed(2)}%)`,
          value: formatCurrency(orderCost),
        });
      }
      if (effectiveDepotFeeMonthly > 0) {
        feeRows.push({
          label: "Depotführungsgebühr",
          value: formatCurrency(effectiveDepotFeeMonthly),
        });
      }
      if (switchFeesPaid > 0) {
        feeRows.push({
          label: "Fondswechsel Transaktionskosten",
          value: formatCurrency(switchFeesPaid),
        });
      }
      if (feeRows.length > 0) {
        feeBreakdown = {
          title: "Depotgebühren",
          rows: [
            ...feeRows,
            {
              label: "Gesamtgebühren",
              value: formatCurrency(totalFees),
              isTotal: true,
            },
          ],
        };
      }
    } else {
      // PAYOUT PHASE

      // price performance
      state.currentSharePrice = calculatePricePerformance(
        state.currentSharePrice,
        monthlyReturnRate,
      );
      state.totalValue = calculateDepotValue(
        state.currentSharePrice,
        state.tranches,
      );

      const payoutMonth = month - accumulationMonths;
      const isWithdrawalMonth =
        payoutParams.withdrawalInterval === "MONTHLY" ||
        (payoutParams.withdrawalInterval === "YEARLY" &&
          payoutMonth % 12 === 0);

      let actualGrossWithdrawal = 0;
      let effectiveSellFee = 0;
      let monthlyNetWithdrawal = 0;
      let sellResult: ReturnType<typeof sellDepotShares> | null = null;

      // execute withdrawal
      if (isWithdrawalMonth && state.totalValue > 0) {
        const calculateNetDepot = (testGross: number): number => {
          const sim = sellDepotShares(
            state.tranches,
            testGross,
            state.currentSharePrice,
            depotParams.partialTaxExemptionRate,
            yearlyTaxAllowance,
            effectiveTaxRate,
            depotParams.depotSellOrderFee,
            depotParams.spreadPercent,
          );
          return sim.netWithdrawal;
        };

        if (payoutParams.withdrawalIsNet) {
          actualGrossWithdrawal = findRequiredGrossForTargetNet(
            currentGrossWithdrawal,
            state.totalValue,
            calculateNetDepot,
          );
        } else {
          actualGrossWithdrawal = Math.min(
            currentGrossWithdrawal,
            state.totalValue,
          );
        }

        sellResult = sellDepotShares(
          state.tranches,
          actualGrossWithdrawal,
          state.currentSharePrice,
          depotParams.partialTaxExemptionRate,
          yearlyTaxAllowance,
          effectiveTaxRate,
          depotParams.depotSellOrderFee,
          depotParams.spreadPercent,
        );

        state.tranches = sellResult.updatedTranches;
        transactionTax = sellResult.taxAmount;
        state.totalTaxPaid += transactionTax;
        yearlyTaxAllowance -= sellResult.consumedAllowance;
        effectiveSellFee = sellResult.effectiveSellFee;
        monthlyNetWithdrawal = sellResult.netWithdrawal;

        grossCashflow = actualGrossWithdrawal > 0 ? -actualGrossWithdrawal : 0;
        netCashflow = monthlyNetWithdrawal > 0 ? -monthlyNetWithdrawal : 0;
      }

      state.totalValue = calculateDepotValue(
        state.currentSharePrice,
        state.tranches,
      );
      totalFees = actualGrossWithdrawal > 0 ? effectiveSellFee : 0;

      const feeRows = [];
      if (actualGrossWithdrawal > 0) {
        feeRows.push({
          label: "Fixe Verkaufsgebühr",
          value: formatCurrency(depotParams.depotSellOrderFee),
        });
        const spreadFee =
          actualGrossWithdrawal * (depotParams.spreadPercent / 2 / 100);
        if (spreadFee > 0.005) {
          feeRows.push({
            label: `Spread (${depotParams.spreadPercent}%)`,
            value: formatCurrency(spreadFee),
          });
        }
        feeBreakdown = {
          title: "Depot Verkaufsgebühren",
          rows: [
            ...feeRows,
            {
              label: "Gesamtgebühren",
              value: formatCurrency(effectiveSellFee),
              isTotal: true,
            },
          ],
        };
      }

      if (
        advanceTaxBreakdown &&
        (transactionTax > 0 || (sellResult && sellResult.taxableGain > 0))
      ) {
        taxBreakdown = {
          title: "Steuern im Januar (Kombiniert)",
          rows: [
            { label: "Vorabpauschale (Vorjahr)", value: "" },
            ...advanceTaxBreakdown.rows.filter((r) => !r.isTotal),
            {
              label: "Steuer (Vorabpauschale)",
              value: formatCurrency(advanceTaxAmount),
            },
            { label: "Kapitalertragsteuer (Entnahme)", value: "" },
            {
              label: "Realisierter Gewinn",
              value: formatCurrency(sellResult?.taxableGain ?? 0),
            },
            {
              label: `nach Teilfreistellung (${100 - depotParams.partialTaxExemptionRate}% TFS)`,
              value: formatCurrency(sellResult?.taxableAfterExemption ?? 0),
            },
            ...(sellResult && sellResult.consumedAllowance > 0
              ? [
                  {
                    label: "FSA (Entnahme) genutzt",
                    value: `- ${formatCurrency(sellResult.consumedAllowance)}`,
                  },
                ]
              : []),
            {
              label: "Zu versteuern (Entnahme)",
              value: formatCurrency(sellResult?.taxableAfterAllowance ?? 0),
            },
            {
              label: "Steuer (Entnahme)",
              value: formatCurrency(transactionTax),
            },
            {
              label: "Gesamtsteuer (Januar)",
              value: formatCurrency(transactionTax + advanceTaxAmount),
              isTotal: true,
            },
          ],
        };
      } else if (
        transactionTax > 0 ||
        (sellResult && sellResult.taxableGain > 0)
      ) {
        taxBreakdown = {
          title: "Kapitalertragsteuer (Verkauf)",
          rows: [
            {
              label: "Verkaufserlös (Brutto)",
              value: formatCurrency(actualGrossWithdrawal),
            },
            {
              label: "Realisierter Gewinn",
              value: formatCurrency(sellResult?.taxableGain ?? 0),
            },
            {
              label: `nach Teilfreistellung (${100 - depotParams.partialTaxExemptionRate}% TFS)`,
              value: formatCurrency(sellResult?.taxableAfterExemption ?? 0),
            },
            ...(sellResult && sellResult.consumedAllowance > 0
              ? [
                  {
                    label: "Freibetrag (FSA) genutzt",
                    value: `- ${formatCurrency(sellResult.consumedAllowance)}`,
                  },
                ]
              : []),
            {
              label: "Zu versteuern",
              value: formatCurrency(sellResult?.taxableAfterAllowance ?? 0),
            },
            {
              label: "Effektiver Steuersatz",
              value: `× ${(effectiveTaxRate * 100).toFixed(2)}%`,
            },
            {
              label: "Steuerlast",
              value: formatCurrency(transactionTax),
              isTotal: true,
            },
          ],
        };
      } else if (advanceTaxBreakdown) {
        taxBreakdown = advanceTaxBreakdown;
      }
    }

    // store end of year share price at month 12, 24, 36...
    if (month % 12 === 0) {
      state.prevYearEndPrice = state.currentSharePrice;
    }

    const netPortfolioValue = calculateDepotNetValue(
      state.tranches,
      state.currentSharePrice,
      depotParams.partialTaxExemptionRate,
      yearlyTaxAllowance,
      effectiveTaxRate,
    );

    const totalTaxAmount = advanceTaxAmount + transactionTax;

    history.push({
      month,
      year: Math.ceil(month / 12),
      phase,
      investedCapital: state.totalInvested,
      portfolioValue: state.totalValue,
      netPortfolioValue,
      grossCashflow,
      netCashflow,
      feesPaid: totalFees,
      taxesPaid: totalTaxAmount,
      taxAllowanceUsed: taxParams.taxAllowanceTotal - yearlyTaxAllowance,
      cumExternalTaxPaid:
        depotParams.advanceTaxFundingSource !== "SELL_SHARES"
          ? (state.totalExternalTaxPaid ?? 0)
          : 0,
      feeBreakdown,
      taxBreakdown,
    });

    if (!isAccumulation && state.totalValue <= 0) {
      state.totalValue = 0;
      break;
    }
  }

  state.totalValue = calculateDepotValue(
    state.currentSharePrice,
    state.tranches,
  );

  return { state, history };
}

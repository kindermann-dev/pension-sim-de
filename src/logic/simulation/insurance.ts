import type {
  GlobalParameters,
  InsuranceParameters,
  TaxParameters,
  WithdrawalPlanParameters,
} from "../../types/simulationParameters";
import type {
  InsuranceState,
  LifecycleDataPoint,
  DetailBreakdown,
} from "../../types/simulation";
import {
  calculateMonthlyReturnRate,
  applyDynamics,
  calculateEffectiveCapitalGainsTaxRate,
  calculatePricePerformance,
  calculatePortfolioValue,
  formatCurrency,
} from "../math/commonMath";
import {
  calculateAlphaCost,
  calculateInsuranceNetInvestment,
  calculateSpecialPaymentNetInvestment,
  calculateGammaCostShares,
  calculateInsuranceWithdrawalTaxAndAllowance,
  calculateSurplusShares,
  calculateInsuranceSurrenderAndNetValue,
} from "../math/insuranceMath";
import { findRequiredGrossForTargetNet } from "../math/payoutMath";

/**
 * Simulates the entire pension insurance lifecycle (accumulation and payout phases)
 * in a single unified monthly discrete-time loop.
 */
export function simulateInsurance(
  globalParams: GlobalParameters,
  insuranceParams: InsuranceParameters,
  taxParams: TaxParameters,
  payoutParams: WithdrawalPlanParameters,
  matchedSpecialContributions?: { month: number; amount: number }[],
): { state: InsuranceState; history: LifecycleDataPoint[] } {
  // init constants
  const accumulationYears = globalParams.ageRetirement - globalParams.ageStart;
  const accumulationMonths = accumulationYears * 12;
  const payoutYears = payoutParams.withdrawalDurationYears;
  const payoutMonths = payoutYears * 12;
  const totalMonths = accumulationMonths + payoutMonths;

  const specialContributionsMap = new Map<number, number>();
  if (matchedSpecialContributions) {
    for (const sc of matchedSpecialContributions) {
      if (sc.amount > 0) {
        specialContributionsMap.set(
          sc.month,
          (specialContributionsMap.get(sc.month) ?? 0) + sc.amount,
        );
      }
    }
  }

  const netAnnualReturnPercent =
    globalParams.marketReturnPa - insuranceParams.trackingDifferencePa;
  const monthlyReturnRate = calculateMonthlyReturnRate(netAnnualReturnPercent);
  const effectiveTaxRate = calculateEffectiveCapitalGainsTaxRate(
    taxParams.capitalGainsTaxRate,
    taxParams.solidaritySurchargeRate,
    taxParams.churchTaxRate,
  );

  // init variables
  let currentSavingsRate = globalParams.monthlySavings;
  let currentGrossWithdrawal = payoutParams.withdrawalValue;
  let yearlyTaxAllowance = taxParams.taxAllowanceTotal;

  const state: InsuranceState = {
    currentSharePrice: 100,
    totalShares: 0,
    totalInvested: 0,
    totalValue: 0,
    totalTaxPaid: 0,
  };

  const history: LifecycleDataPoint[] = [];

  // initial capital
  if (globalParams.initialCapital > 0) {
    state.totalShares += globalParams.initialCapital / state.currentSharePrice;
    state.totalInvested += globalParams.initialCapital;
    state.totalValue = calculatePortfolioValue(
      state.currentSharePrice,
      state.totalShares,
    );
  }

  // main lifecycle loop
  for (let month = 1; month <= totalMonths; month++) {
    const isAccumulation = month <= accumulationMonths;
    const phase: "ACCUMULATION" | "PAYOUT" = isAccumulation
      ? "ACCUMULATION"
      : "PAYOUT";

    let grossCashflow = 0;
    let netCashflow = 0;
    let totalFees = 0;
    let transactionTax = 0;

    let feeBreakdown: DetailBreakdown = {
      title: "Versicherungskosten",
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
    }

    if (isAccumulation) {
      // ACCUMULATION PHASE
      let netInvestment = 0;
      let alphaCost = 0;
      let betaCost = 0;
      const fixedCostMonthly = insuranceParams.betaCostFixedPa / 12;

      if (currentSavingsRate > 0) {
        alphaCost = calculateAlphaCost(
          currentSavingsRate,
          accumulationMonths,
          insuranceParams.alphaCostZillmerRate,
          insuranceParams.alphaCostRemainingRate,
          month,
          insuranceParams.alphaCostDurationYears * 12,
        );

        betaCost =
          currentSavingsRate * (insuranceParams.betaCostContributionRate / 100);

        netInvestment = calculateInsuranceNetInvestment(
          currentSavingsRate,
          alphaCost,
          insuranceParams.betaCostContributionRate,
          insuranceParams.betaCostFixedPa,
        );

        if (netInvestment > 0) {
          state.totalShares += netInvestment / state.currentSharePrice;
        }

        state.totalInvested += currentSavingsRate;
      }

      // Check for matched special contribution (Zuzahlung) in this month
      const specialPaymentGross = specialContributionsMap.get(month) ?? 0;
      let alphaCostSpecial = 0;
      let betaCostSpecial = 0;
      let netSpecialInvestment = 0;

      if (specialPaymentGross > 0) {
        const specialResult = calculateSpecialPaymentNetInvestment(
          specialPaymentGross,
          insuranceParams.alphaCostSpecialPaymentRate ?? 2.5,
          insuranceParams.betaCostSpecialPaymentRate ?? 1.75,
        );
        alphaCostSpecial = specialResult.alphaCost;
        betaCostSpecial = specialResult.betaCost;
        netSpecialInvestment = specialResult.netInvestment;

        if (netSpecialInvestment > 0) {
          state.totalShares += netSpecialInvestment / state.currentSharePrice;
        }
        state.totalInvested += specialPaymentGross;
      }

      grossCashflow = currentSavingsRate + specialPaymentGross;
      netCashflow = netInvestment + netSpecialInvestment;

      // price performance
      state.currentSharePrice = calculatePricePerformance(
        state.currentSharePrice,
        monthlyReturnRate,
      );
      state.totalValue = calculatePortfolioValue(
        state.currentSharePrice,
        state.totalShares,
      );

      // gamma costs (Assets under Management)
      let gammaCostEur = 0;
      if (
        state.totalShares > 0 &&
        insuranceParams.adminCostCapitalPaAccumulation > 0
      ) {
        const sharesToSell = calculateGammaCostShares(
          state.totalShares,
          insuranceParams.adminCostCapitalPaAccumulation,
        );
        state.totalShares -= sharesToSell;
        gammaCostEur = sharesToSell * state.currentSharePrice;
        state.totalValue = calculatePortfolioValue(
          state.currentSharePrice,
          state.totalShares,
        );
      }

      // surplus participation (Überschussbeteiligung)
      let surplusEur = 0;
      if (
        state.totalShares > 0 &&
        insuranceParams.surplusParticipationRatePa > 0
      ) {
        const surplusShares = calculateSurplusShares(
          state.totalShares,
          insuranceParams.surplusParticipationRatePa,
        );
        state.totalShares += surplusShares;
        surplusEur = surplusShares * state.currentSharePrice;
        state.totalValue = calculatePortfolioValue(
          state.currentSharePrice,
          state.totalShares,
        );
      }

      // Fund Switch (Fondswechsel) inside Insurance Wrapper (100% Tax-Free!)
      let switchFeePaid = 0;
      const isFundSwitchMonth =
        globalParams.fundSwitchIntervalYears > 0 &&
        month % (globalParams.fundSwitchIntervalYears * 12) === 0 &&
        month < accumulationMonths &&
        state.totalShares > 0;

      if (isFundSwitchMonth) {
        switchFeePaid = insuranceParams.insuranceFundSwitchFee || 0;
        if (switchFeePaid > 0) {
          const switchFeeShares = switchFeePaid / state.currentSharePrice;
          state.totalShares = Math.max(0, state.totalShares - switchFeeShares);
          state.totalValue = calculatePortfolioValue(
            state.currentSharePrice,
            state.totalShares,
          );
        }
      }

      const regularContributionFees =
        currentSavingsRate > 0 ? currentSavingsRate - netInvestment : 0;
      const specialPaymentFees = alphaCostSpecial + betaCostSpecial;
      totalFees =
        regularContributionFees +
        specialPaymentFees +
        gammaCostEur +
        switchFeePaid -
        surplusEur;

      const feeRows = [];
      if (alphaCost > 0)
        feeRows.push({
          label: "Alpha (Abschlusskosten Sparrate)",
          value: formatCurrency(alphaCost),
        });
      if (alphaCostSpecial > 0) {
        feeRows.push({
          label: `Alpha Zuzahlung (${(insuranceParams.alphaCostSpecialPaymentRate ?? 2.5).toFixed(2)}%)`,
          value: formatCurrency(alphaCostSpecial),
        });
      }
      if (betaCost > 0)
        feeRows.push({
          label: "Beta (Laufender Beitrag)",
          value: formatCurrency(betaCost),
        });
      if (betaCostSpecial > 0) {
        feeRows.push({
          label: `Beta Zuzahlung (${(insuranceParams.betaCostSpecialPaymentRate ?? 1.75).toFixed(2)}%)`,
          value: formatCurrency(betaCostSpecial),
        });
      }
      if (fixedCostMonthly > 0)
        feeRows.push({
          label: "Fixkosten (monatlich)",
          value: formatCurrency(fixedCostMonthly),
        });
      if (gammaCostEur > 0)
        feeRows.push({
          label: "Gamma (Vermögensverwaltung)",
          value: formatCurrency(gammaCostEur),
        });
      if (switchFeePaid > 0)
        feeRows.push({
          label: "Fondswechsel Gebühr",
          value: formatCurrency(switchFeePaid),
        });
      if (surplusEur > 0)
        feeRows.push({
          label: "Überschussbeteiligung",
          value: `- ${formatCurrency(surplusEur)}`,
        });
      if (feeRows.length > 0) {
        feeBreakdown = {
          title: "Versicherungskosten",
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

      taxBreakdown = {
        title: isFundSwitchMonth
          ? "Fondswechsel (Steuerfrei in Police)"
          : "Steuer (Ansparphase)",
        rows: isFundSwitchMonth
          ? [
              { label: "Status", value: "Steuerfrei im Versicherungsmantel" },
              {
                label: "Umschichtungsvolumen",
                value: formatCurrency(state.totalValue),
              },
              {
                label: "Steuerlast",
                value: "0,00 € (100% steuerfrei)",
                isTotal: true,
              },
            ]
          : [
              { label: "Status", value: "Steuerfrei in der Ansparphase" },
              {
                label: "Vorabpauschale",
                value: "0,00 € (Police gesetzlich befreit)",
              },
              ...(specialPaymentGross > 0
                ? [
                    {
                      label: "Zuzahlung (Vorabsteuer-Match)",
                      value: formatCurrency(specialPaymentGross),
                    },
                  ]
                : []),
            ],
      };
    } else {
      // PAYOUT PHASE

      // price performance
      state.currentSharePrice = calculatePricePerformance(
        state.currentSharePrice,
        monthlyReturnRate,
      );
      state.totalValue = calculatePortfolioValue(
        state.currentSharePrice,
        state.totalShares,
      );

      // gamma costs (Assets under Management in Payout)
      let gammaCostEur = 0;
      if (
        state.totalShares > 0 &&
        insuranceParams.adminCostCapitalPaPayout > 0
      ) {
        const sharesToSell = calculateGammaCostShares(
          state.totalShares,
          insuranceParams.adminCostCapitalPaPayout,
        );
        state.totalShares -= sharesToSell;
        gammaCostEur = sharesToSell * state.currentSharePrice;
        state.totalValue = calculatePortfolioValue(
          state.currentSharePrice,
          state.totalShares,
        );
      }

      // surplus participation (Überschussbeteiligung in Payout)
      let surplusEur = 0;
      if (
        state.totalShares > 0 &&
        insuranceParams.surplusParticipationRatePa > 0
      ) {
        const surplusShares = calculateSurplusShares(
          state.totalShares,
          insuranceParams.surplusParticipationRatePa,
        );
        state.totalShares += surplusShares;
        surplusEur = surplusShares * state.currentSharePrice;
        state.totalValue = calculatePortfolioValue(
          state.currentSharePrice,
          state.totalShares,
        );
      }

      const payoutMonth = month - accumulationMonths;
      const isWithdrawalMonth =
        payoutParams.withdrawalInterval === "MONTHLY" ||
        (payoutParams.withdrawalInterval === "YEARLY" &&
          payoutMonth % 12 === 0);

      let actualGrossWithdrawal = 0;
      let monthlyNetWithdrawal = 0;
      let withdrawalFee = 0;
      let gainPortion = 0;
      let consumedAllowance = 0;

      // execute withdrawal
      if (isWithdrawalMonth && state.totalValue > 0) {
        const calculateNetInsurance = (testGross: number): number => {
          const sim = calculateInsuranceWithdrawalTaxAndAllowance(
            testGross,
            state.totalValue,
            state.totalInvested,
            taxParams.marginalTaxRateRetirement,
            taxParams.capitalGainsTaxRate,
            taxParams.solidaritySurchargeRate,
            taxParams.churchTaxRate,
            insuranceParams.insurancePartialTaxExemptionRate,
            insuranceParams.halfIncomeProcedureActive,
            yearlyTaxAllowance,
          );
          const fee = Math.min(
            testGross * (payoutParams.insuranceWithdrawalFeeRate / 100),
            payoutParams.insuranceWithdrawalFeeMaxAbsolute,
          );
          return Math.max(0, testGross - sim.tax - fee);
        };

        if (payoutParams.withdrawalIsNet) {
          actualGrossWithdrawal = findRequiredGrossForTargetNet(
            currentGrossWithdrawal,
            state.totalValue,
            calculateNetInsurance,
          );
        } else {
          actualGrossWithdrawal = Math.min(
            currentGrossWithdrawal,
            state.totalValue,
          );
        }

        const taxResult = calculateInsuranceWithdrawalTaxAndAllowance(
          actualGrossWithdrawal,
          state.totalValue,
          state.totalInvested,
          taxParams.marginalTaxRateRetirement,
          taxParams.capitalGainsTaxRate,
          taxParams.solidaritySurchargeRate,
          taxParams.churchTaxRate,
          insuranceParams.insurancePartialTaxExemptionRate,
          insuranceParams.halfIncomeProcedureActive,
          yearlyTaxAllowance,
        );

        transactionTax = taxResult.tax;
        consumedAllowance = taxResult.consumedTaxAllowance;
        yearlyTaxAllowance -= consumedAllowance;
        state.totalTaxPaid += transactionTax;

        const totalGain = Math.max(0, state.totalValue - state.totalInvested);
        gainPortion =
          state.totalValue > 0
            ? actualGrossWithdrawal * (totalGain / state.totalValue)
            : 0;

        withdrawalFee = Math.min(
          actualGrossWithdrawal *
            (payoutParams.insuranceWithdrawalFeeRate / 100),
          payoutParams.insuranceWithdrawalFeeMaxAbsolute,
        );
        monthlyNetWithdrawal = Math.max(
          0,
          actualGrossWithdrawal - transactionTax - withdrawalFee,
        );

        // reduce invested capital basis proportionally
        const withdrawalRatio =
          state.totalValue > 0 ? actualGrossWithdrawal / state.totalValue : 0;
        state.totalInvested = Math.max(
          0,
          state.totalInvested - state.totalInvested * withdrawalRatio,
        );

        // reduce shares
        const sharesWithdrawn = actualGrossWithdrawal / state.currentSharePrice;
        state.totalShares = Math.max(0, state.totalShares - sharesWithdrawn);
        state.totalValue = calculatePortfolioValue(
          state.currentSharePrice,
          state.totalShares,
        );

        grossCashflow = actualGrossWithdrawal > 0 ? -actualGrossWithdrawal : 0;
        netCashflow = monthlyNetWithdrawal > 0 ? -monthlyNetWithdrawal : 0;
      }

      totalFees = withdrawalFee + gammaCostEur - surplusEur;

      const feeRows = [];
      if (withdrawalFee > 0)
        feeRows.push({
          label: "Entnahmegebühr",
          value: formatCurrency(withdrawalFee),
        });
      if (gammaCostEur > 0)
        feeRows.push({
          label: "Gamma (Vermögensverwaltung)",
          value: formatCurrency(gammaCostEur),
        });
      if (surplusEur > 0)
        feeRows.push({
          label: "Überschussbeteiligung",
          value: `- ${formatCurrency(surplusEur)}`,
        });
      if (feeRows.length > 0) {
        feeBreakdown = {
          title: "Versicherungskosten (Entnahme)",
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

      if (isWithdrawalMonth && actualGrossWithdrawal > 0) {
        if (insuranceParams.halfIncomeProcedureActive) {
          const taxableGainHalfIncome =
            gainPortion *
            0.5 *
            (1 - insuranceParams.insurancePartialTaxExemptionRate / 100);
          taxBreakdown = {
            title: "Halbeinkünfteverfahren (§ 20 Abs. 1 Nr. 6 EStG)",
            rows: [
              {
                label: "Entnahmebetrag (Brutto)",
                value: formatCurrency(actualGrossWithdrawal),
              },
              {
                label: "Ertragsanteil (Gewinn)",
                value: formatCurrency(gainPortion),
              },
              {
                label: "Halbeinkünfte (50%)",
                value: formatCurrency(gainPortion * 0.5),
              },
              {
                label: `nach Teilfreistellung (${100 - insuranceParams.insurancePartialTaxExemptionRate}% TFS)`,
                value: formatCurrency(taxableGainHalfIncome),
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
                value: formatCurrency(
                  Math.max(0, taxableGainHalfIncome - consumedAllowance),
                ),
              },
              {
                label: "Individueller Grenzsteuersatz",
                value: `× ${taxParams.marginalTaxRateRetirement}%`,
              },
              {
                label: "Steuerlast",
                value: formatCurrency(transactionTax),
                isTotal: true,
              },
            ],
          };
        } else {
          const taxableGainStandardTax =
            gainPortion *
            (1 - insuranceParams.insurancePartialTaxExemptionRate / 100);
          taxBreakdown = {
            title: "Abgeltungsteuer (Police)",
            rows: [
              {
                label: "Entnahmebetrag (Brutto)",
                value: formatCurrency(actualGrossWithdrawal),
              },
              {
                label: "Ertragsanteil (Gewinn)",
                value: formatCurrency(gainPortion),
              },
              {
                label: `nach Teilfreistellung (${100 - insuranceParams.insurancePartialTaxExemptionRate}% TFS)`,
                value: formatCurrency(taxableGainStandardTax),
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
                value: formatCurrency(
                  Math.max(0, taxableGainStandardTax - consumedAllowance),
                ),
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
        }
      }
    }

    const currentAge = globalParams.ageStart + month / 12;
    const currentDurationYears = month / 12;

    const valuation = calculateInsuranceSurrenderAndNetValue(
      state.totalShares,
      state.currentSharePrice,
      state.totalInvested,
      month,
      accumulationMonths,
      insuranceParams.alphaCostZillmerRate,
      insuranceParams.alphaCostDurationYears * 12,
      insuranceParams.insurancePartialTaxExemptionRate,
      insuranceParams.halfIncomeProcedureActive,
      currentDurationYears,
      currentAge,
      yearlyTaxAllowance,
      taxParams.marginalTaxRateRetirement,
      effectiveTaxRate,
    );

    history.push({
      month,
      year: Math.ceil(month / 12),
      phase,
      investedCapital: state.totalInvested,
      portfolioValue: state.totalValue,
      surrenderValue: valuation.insuranceSurrenderValue,
      netPortfolioValue: valuation.insuranceNetLiquidityValue,
      grossCashflow,
      netCashflow,
      feesPaid: totalFees,
      taxesPaid: transactionTax,
      taxAllowanceUsed: taxParams.taxAllowanceTotal - yearlyTaxAllowance,
      feeBreakdown,
      taxBreakdown,
    });

    if (!isAccumulation && state.totalValue <= 0) {
      state.totalValue = 0;
      break;
    }
  }

  state.totalValue = calculatePortfolioValue(
    state.currentSharePrice,
    state.totalShares,
  );

  return { state, history };
}

/**
 * Convenience wrapper for accumulation-only simulation (e.g. for modular calls and backward compatibility in tests).
 */
export function simulateInsuranceAccumulation(
  globalParams: GlobalParameters,
  insuranceParams: InsuranceParameters,
  taxParams?: TaxParameters,
  matchedSpecialContributions?: { month: number; amount: number }[],
): { state: InsuranceState; history: LifecycleDataPoint[] } {
  const defaultTaxParams: TaxParameters = taxParams ?? {
    taxAllowanceTotal: 1000,
    capitalGainsTaxRate: 25,
    solidaritySurchargeRate: 5.5,
    churchTaxRate: 0,
    marginalTaxRateRetirement: 25,
    enableAdvanceTax: true,
  };

  const noPayoutParams: WithdrawalPlanParameters = {
    withdrawalInterval: "MONTHLY",
    withdrawalType: "ABSOLUTE_AMOUNT",
    withdrawalValue: 0,
    withdrawalIsNet: true,
    withdrawalDurationYears: 0,
    withdrawalDynamicsPa: 0,
    withdrawalDynamicsLinkedToInflation: false,
    insuranceWithdrawalFeeRate: 0,
    insuranceWithdrawalFeeMaxAbsolute: 0,
  };

  return simulateInsurance(
    globalParams,
    insuranceParams,
    defaultTaxParams,
    noPayoutParams,
    matchedSpecialContributions,
  );
}

/**
 * Convenience wrapper for payout-only simulation starting from an existing accumulation state (e.g. for testing).
 */
export function simulateInsurancePayout(
  accumulationState: InsuranceState,
  globalParams: GlobalParameters,
  insuranceParams: InsuranceParameters,
  taxParams: TaxParameters,
  payoutParams: WithdrawalPlanParameters,
): { state: InsuranceState; history: LifecycleDataPoint[] } {
  const payoutYears = payoutParams.withdrawalDurationYears;
  const totalMonths = payoutYears * 12;

  const netAnnualReturnPercent =
    globalParams.marketReturnPa - insuranceParams.trackingDifferencePa;
  const monthlyReturnRate = calculateMonthlyReturnRate(netAnnualReturnPercent);
  const effectiveTaxRate = calculateEffectiveCapitalGainsTaxRate(
    taxParams.capitalGainsTaxRate,
    taxParams.solidaritySurchargeRate,
    taxParams.churchTaxRate,
  );

  const state: InsuranceState = {
    currentSharePrice: accumulationState.currentSharePrice,
    totalShares: accumulationState.totalShares,
    totalInvested: accumulationState.totalInvested,
    totalValue: accumulationState.totalValue,
    totalTaxPaid: accumulationState.totalTaxPaid || 0,
  };

  if (state.totalValue <= 0) {
    return { state, history: [] };
  }

  const history: LifecycleDataPoint[] = [];
  let currentGrossWithdrawal = payoutParams.withdrawalValue;
  let yearlyTaxAllowance = taxParams.taxAllowanceTotal;
  const accumulationMonths =
    (globalParams.ageRetirement - globalParams.ageStart) * 12;

  for (let month = 1; month <= totalMonths; month++) {
    // price performance
    state.currentSharePrice = calculatePricePerformance(
      state.currentSharePrice,
      monthlyReturnRate,
    );
    state.totalValue = calculatePortfolioValue(
      state.currentSharePrice,
      state.totalShares,
    );

    // yearly dynamics & allowance reset
    if (month > 1 && (month - 1) % 12 === 0) {
      const effectiveWithdrawalDynamics =
        payoutParams.withdrawalDynamicsLinkedToInflation
          ? globalParams.inflationRatePa
          : payoutParams.withdrawalDynamicsPa;
      currentGrossWithdrawal = applyDynamics(
        currentGrossWithdrawal,
        effectiveWithdrawalDynamics,
      );
      yearlyTaxAllowance = taxParams.taxAllowanceTotal;
    }

    // gamma management fees
    let gammaCostEur = 0;
    if (state.totalShares > 0 && insuranceParams.adminCostCapitalPaPayout > 0) {
      const sharesToSell = calculateGammaCostShares(
        state.totalShares,
        insuranceParams.adminCostCapitalPaPayout,
      );
      state.totalShares -= sharesToSell;
      gammaCostEur = sharesToSell * state.currentSharePrice;
      state.totalValue = calculatePortfolioValue(
        state.currentSharePrice,
        state.totalShares,
      );
    }

    // surplus allocation
    let surplusEur = 0;
    if (
      state.totalShares > 0 &&
      insuranceParams.surplusParticipationRatePa > 0
    ) {
      const surplusShares = calculateSurplusShares(
        state.totalShares,
        insuranceParams.surplusParticipationRatePa,
      );
      state.totalShares += surplusShares;
      surplusEur = surplusShares * state.currentSharePrice;
      state.totalValue = calculatePortfolioValue(
        state.currentSharePrice,
        state.totalShares,
      );
    }

    const isWithdrawalMonth =
      payoutParams.withdrawalInterval === "MONTHLY" ||
      (payoutParams.withdrawalInterval === "YEARLY" && month % 12 === 0);

    let actualGrossWithdrawal = 0;
    let monthlyNetWithdrawal = 0;
    let transactionTax = 0;
    let withdrawalFee = 0;
    let gainPortion = 0;
    let consumedAllowance = 0;

    if (isWithdrawalMonth && state.totalValue > 0) {
      const calculateNetInsurance = (testGross: number): number => {
        const sim = calculateInsuranceWithdrawalTaxAndAllowance(
          testGross,
          state.totalValue,
          state.totalInvested,
          taxParams.marginalTaxRateRetirement,
          taxParams.capitalGainsTaxRate,
          taxParams.solidaritySurchargeRate,
          taxParams.churchTaxRate,
          insuranceParams.insurancePartialTaxExemptionRate,
          insuranceParams.halfIncomeProcedureActive,
          yearlyTaxAllowance,
        );
        const fee = Math.min(
          testGross * (payoutParams.insuranceWithdrawalFeeRate / 100),
          payoutParams.insuranceWithdrawalFeeMaxAbsolute,
        );
        return Math.max(0, testGross - sim.tax - fee);
      };

      if (payoutParams.withdrawalIsNet) {
        actualGrossWithdrawal = findRequiredGrossForTargetNet(
          currentGrossWithdrawal,
          state.totalValue,
          calculateNetInsurance,
        );
      } else {
        actualGrossWithdrawal = Math.min(
          currentGrossWithdrawal,
          state.totalValue,
        );
      }

      const taxResult = calculateInsuranceWithdrawalTaxAndAllowance(
        actualGrossWithdrawal,
        state.totalValue,
        state.totalInvested,
        taxParams.marginalTaxRateRetirement,
        taxParams.capitalGainsTaxRate,
        taxParams.solidaritySurchargeRate,
        taxParams.churchTaxRate,
        insuranceParams.insurancePartialTaxExemptionRate,
        insuranceParams.halfIncomeProcedureActive,
        yearlyTaxAllowance,
      );

      transactionTax = taxResult.tax;
      consumedAllowance = taxResult.consumedTaxAllowance;
      yearlyTaxAllowance -= consumedAllowance;
      state.totalTaxPaid += transactionTax;

      const totalGain = Math.max(0, state.totalValue - state.totalInvested);
      gainPortion =
        state.totalValue > 0
          ? actualGrossWithdrawal * (totalGain / state.totalValue)
          : 0;

      withdrawalFee = Math.min(
        actualGrossWithdrawal * (payoutParams.insuranceWithdrawalFeeRate / 100),
        payoutParams.insuranceWithdrawalFeeMaxAbsolute,
      );
      monthlyNetWithdrawal = Math.max(
        0,
        actualGrossWithdrawal - transactionTax - withdrawalFee,
      );

      const withdrawalRatio =
        state.totalValue > 0 ? actualGrossWithdrawal / state.totalValue : 0;
      state.totalInvested = Math.max(
        0,
        state.totalInvested - state.totalInvested * withdrawalRatio,
      );

      const sharesWithdrawn = actualGrossWithdrawal / state.currentSharePrice;
      state.totalShares = Math.max(0, state.totalShares - sharesWithdrawn);
      state.totalValue = calculatePortfolioValue(
        state.currentSharePrice,
        state.totalShares,
      );
    }

    const totalFees = withdrawalFee + gammaCostEur - surplusEur;

    const feeRows = [];
    if (withdrawalFee > 0)
      feeRows.push({
        label: "Entnahmegebühr",
        value: formatCurrency(withdrawalFee),
      });
    if (gammaCostEur > 0)
      feeRows.push({
        label: "Gamma (Vermögensverwaltung)",
        value: formatCurrency(gammaCostEur),
      });
    if (surplusEur > 0)
      feeRows.push({
        label: "Überschussbeteiligung",
        value: `- ${formatCurrency(surplusEur)}`,
      });
    const feeBreakdown: DetailBreakdown = {
      title: "Versicherungskosten (Entnahme)",
      rows:
        feeRows.length > 0
          ? [
              ...feeRows,
              {
                label: "Gesamtgebühren",
                value: formatCurrency(totalFees),
                isTotal: true,
              },
            ]
          : [{ label: "Status", value: "Keine Gebühren" }],
    };

    let taxBreakdown: DetailBreakdown = {
      title: "Steuer",
      rows: [{ label: "Status", value: "Keine Steuer fällig" }],
    };

    if (isWithdrawalMonth && actualGrossWithdrawal > 0) {
      if (insuranceParams.halfIncomeProcedureActive) {
        const taxableGainHalfIncome =
          gainPortion *
          0.5 *
          (1 - insuranceParams.insurancePartialTaxExemptionRate / 100);
        taxBreakdown = {
          title: "Halbeinkünfteverfahren (§ 20 Abs. 1 Nr. 6 EStG)",
          rows: [
            {
              label: "Entnahmebetrag (Brutto)",
              value: formatCurrency(actualGrossWithdrawal),
            },
            {
              label: "Ertragsanteil (Gewinn)",
              value: formatCurrency(gainPortion),
            },
            {
              label: "Halbeinkünfte (50%)",
              value: formatCurrency(gainPortion * 0.5),
            },
            {
              label: `nach Teilfreistellung (${100 - insuranceParams.insurancePartialTaxExemptionRate}% TFS)`,
              value: formatCurrency(taxableGainHalfIncome),
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
              value: formatCurrency(
                Math.max(0, taxableGainHalfIncome - consumedAllowance),
              ),
            },
            {
              label: "Individueller Grenzsteuersatz",
              value: `× ${taxParams.marginalTaxRateRetirement}%`,
            },
            {
              label: "Steuerlast",
              value: formatCurrency(transactionTax),
              isTotal: true,
            },
          ],
        };
      } else {
        const taxableGainStandardTax =
          gainPortion *
          (1 - insuranceParams.insurancePartialTaxExemptionRate / 100);
        taxBreakdown = {
          title: "Abgeltungsteuer (Police)",
          rows: [
            {
              label: "Entnahmebetrag (Brutto)",
              value: formatCurrency(actualGrossWithdrawal),
            },
            {
              label: "Ertragsanteil (Gewinn)",
              value: formatCurrency(gainPortion),
            },
            {
              label: `nach Teilfreistellung (${100 - insuranceParams.insurancePartialTaxExemptionRate}% TFS)`,
              value: formatCurrency(taxableGainStandardTax),
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
              value: formatCurrency(
                Math.max(0, taxableGainStandardTax - consumedAllowance),
              ),
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
      }
    }

    const currentMonthTotal = accumulationMonths + month;
    const currentDurationYears = currentMonthTotal / 12;
    const currentAge = globalParams.ageStart + currentDurationYears;

    const valuation = calculateInsuranceSurrenderAndNetValue(
      state.totalShares,
      state.currentSharePrice,
      state.totalInvested,
      currentMonthTotal,
      accumulationMonths,
      insuranceParams.alphaCostZillmerRate,
      insuranceParams.alphaCostDurationYears * 12,
      insuranceParams.insurancePartialTaxExemptionRate,
      insuranceParams.halfIncomeProcedureActive,
      currentDurationYears,
      currentAge,
      yearlyTaxAllowance,
      taxParams.marginalTaxRateRetirement,
      effectiveTaxRate,
    );

    history.push({
      month,
      year: Math.ceil(month / 12),
      phase: "PAYOUT",
      investedCapital: state.totalInvested,
      portfolioValue: state.totalValue,
      surrenderValue: valuation.insuranceSurrenderValue,
      netPortfolioValue: valuation.insuranceNetLiquidityValue,
      grossCashflow: actualGrossWithdrawal > 0 ? -actualGrossWithdrawal : 0,
      netCashflow: monthlyNetWithdrawal > 0 ? -monthlyNetWithdrawal : 0,
      feesPaid: totalFees,
      taxesPaid: transactionTax,
      taxAllowanceUsed: taxParams.taxAllowanceTotal - yearlyTaxAllowance,
      feeBreakdown,
      taxBreakdown,
    });

    if (state.totalValue <= 0) {
      state.totalValue = 0;
      break;
    }
  }

  return { state, history };
}

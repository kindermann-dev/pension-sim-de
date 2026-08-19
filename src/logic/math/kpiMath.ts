import type {
  CombinedDataPoint,
  SimulationKPIs,
  BreakEvenResult,
} from "../../types/simulation";
import type {
  GlobalParameters,
  DepotParameters,
  InsuranceParameters,
  TaxParameters,
  WithdrawalPlanParameters,
} from "../../types/simulationParameters";
import {
  calculateEffectiveCapitalGainsTaxRate,
  calculateTaxWithAllowance,
} from "./commonMath";
import { calculateInsuranceNetValue } from "./insuranceMath";

/**
 * Calculates the annualized Internal Rate of Return (IRR / XIRR)
 * from a series of monthly cash flows using Newton-Raphson with Bisection fallback.
 */
export function calculateXirr(
  cashflows: { month: number; amount: number }[],
): number {
  if (cashflows.length < 2) return 0;

  let hasPositive = false;
  let hasNegative = false;
  for (const cf of cashflows) {
    if (cf.amount > 0.0001) hasPositive = true;
    if (cf.amount < -0.0001) hasNegative = true;
  }
  if (!hasPositive || !hasNegative) return 0;

  const annualize = (monthlyR: number): number => {
    if (monthlyR <= -1) return -1;
    return Math.pow(1 + monthlyR, 12) - 1;
  };

  // NPV function for monthly discount rate r
  const npv = (r: number): number => {
    let sum = 0;
    for (const cf of cashflows) {
      sum += cf.amount / Math.pow(1 + r, cf.month);
    }
    return sum;
  };

  // Derivative of NPV with respect to r
  const dNpv = (r: number): number => {
    let sum = 0;
    for (const cf of cashflows) {
      if (cf.month === 0) continue;
      sum += (-cf.month * cf.amount) / Math.pow(1 + r, cf.month + 1);
    }
    return sum;
  };

  // Newton-Raphson search
  let r = 0.005; // Initial guess ~6% p.a.
  const maxIter = 60;
  const tol = 1e-7;

  for (let i = 0; i < maxIter; i++) {
    const fVal = npv(r);
    if (Math.abs(fVal) < tol) {
      return annualize(r);
    }
    const fPrime = dNpv(r);
    if (Math.abs(fPrime) > 1e-9) {
      const rNext = r - fVal / fPrime;
      if (rNext > -0.99 && rNext < 3.0) {
        r = rNext;
        continue;
      }
    }
    break;
  }

  // Bisection fallback
  let a = -0.95;
  let b = 2.0;
  let fa = npv(a);
  let fb = npv(b);

  if (fa * fb > 0) {
    for (let step = 0; step < 10; step++) {
      a = Math.max(-0.99, a - 0.05);
      b += 1.0;
      fa = npv(a);
      fb = npv(b);
      if (fa * fb <= 0) break;
    }
  }

  if (fa * fb <= 0) {
    for (let iter = 0; iter < 80; iter++) {
      const mid = (a + b) / 2;
      const fMid = npv(mid);
      if (Math.abs(fMid) < tol || b - a < 1e-7) {
        return annualize(mid);
      }
      if (fa * fMid <= 0) {
        b = mid;
        fb = fMid;
      } else {
        a = mid;
        fa = fMid;
      }
    }
    return annualize((a + b) / 2);
  }

  return annualize(r);
}

/**
 * Calculates the break-even age where accumulated net payouts + net portfolio value
 * of the insurance becomes greater than or equal to the depot.
 */
export function calculateBreakEvenAge(
  history: CombinedDataPoint[],
  ageStart: number,
): BreakEvenResult {
  if (history.length === 0) {
    return {
      reached: false,
      ageYears: null,
      ageMonths: null,
      month: null,
      description: "Keine Daten vorhanden",
    };
  }

  let cumPayoutDepot = 0;
  let cumPayoutInsurance = 0;

  for (const point of history) {
    if (point.phase === "PAYOUT") {
      cumPayoutDepot += Math.abs(point.depotNetCashflow);
      cumPayoutInsurance += Math.abs(point.insuranceNetCashflow);
    }

    const totalWealthDepot = cumPayoutDepot + point.depotValueNet;
    const totalWealthInsurance = cumPayoutInsurance + point.insuranceValueNet;

    // Check if Insurance matches or surpasses Depot with positive wealth
    if (
      totalWealthInsurance >= totalWealthDepot &&
      (totalWealthInsurance > 0 || totalWealthDepot > 0) &&
      point.month > 0
    ) {
      const totalMonths = point.month;
      const totalAgeInMonths = ageStart * 12 + totalMonths;
      const ageYears = Math.floor(totalAgeInMonths / 12);
      const ageMonths = totalAgeInMonths % 12;
      return {
        reached: true,
        ageYears,
        ageMonths,
        month: point.month,
        description: `Erreicht mit Alter ${ageYears} Jahren und ${ageMonths} Monaten (Monat ${point.month})`,
      };
    }
  }

  return {
    reached: false,
    ageYears: null,
    ageMonths: null,
    month: null,
    description: "Depot bleibt über die gesamte Laufzeit überlegen",
  };
}

/**
 * Calculates the net liquidation value of the ETF depot upon complete immediate sale.
 */
export function calculateDepotLiquidationValue(
  depotValue: number,
  totalInvested: number,
  partialTaxExemptionRate: number,
  availableTaxAllowance: number,
  effectiveTaxRate: number,
): number {
  if (depotValue <= 0) return 0;
  const unrealizedGain = Math.max(0, depotValue - totalInvested);
  const { taxAmount } = calculateTaxWithAllowance(
    unrealizedGain,
    partialTaxExemptionRate,
    availableTaxAllowance,
    effectiveTaxRate,
  );
  return Math.max(0, depotValue - taxAmount);
}

/**
 * Calculates the net surrender value of the insurance policy upon complete termination.
 * Checks the 12/62 rule (§ 20 Abs. 1 Nr. 6 EStG: duration >= 12 years AND age >= 62).
 */
export function calculateInsuranceLiquidationValue(
  insuranceValue: number,
  totalInvested: number,
  insurancePartialTaxExemptionRate: number,
  halfIncomeProcedureActive: boolean,
  durationYears: number,
  ageAtLiquidation: number,
  availableTaxAllowance: number,
  marginalTaxRateRetirement: number,
  effectiveCapitalGainsTaxRate: number,
): number {
  return calculateInsuranceNetValue(
    insuranceValue,
    totalInvested,
    insurancePartialTaxExemptionRate,
    halfIncomeProcedureActive,
    durationYears,
    ageAtLiquidation,
    availableTaxAllowance,
    marginalTaxRateRetirement,
    effectiveCapitalGainsTaxRate,
  );
}

/**
 * Calculates the implicit pension factor (monthly net payout per 10,000 € capital at retirement).
 */
export function calculateImplicitRentenfaktor(
  monthlyNetPayout: number,
  portfolioValueAtRetirement: number,
): number {
  if (portfolioValueAtRetirement <= 0 || monthlyNetPayout <= 0) return 0;
  return (monthlyNetPayout / portfolioValueAtRetirement) * 10000;
}

/**
 * Orchestrates calculation of all 5 lifecycle KPIs and summary metrics.
 */
export function calculateSimulationKPIs(
  history: CombinedDataPoint[],
  globalParams: GlobalParameters,
  depotParams: DepotParameters,
  insuranceParams: InsuranceParameters,
  taxParams: TaxParameters,
  payoutParams: WithdrawalPlanParameters,
): SimulationKPIs {
  const effectiveTaxRate = calculateEffectiveCapitalGainsTaxRate(
    taxParams.capitalGainsTaxRate,
    taxParams.solidaritySurchargeRate,
    taxParams.churchTaxRate,
  );

  const lastPoint = history[history.length - 1];
  const retirementIndex = history.findIndex((p) => p.phase === "PAYOUT");
  const retirementPoint =
    retirementIndex >= 0
      ? (history[retirementIndex - 1] ?? history[0])
      : lastPoint;

  // 1. Build Cashflows for XIRR
  const depotCashflows: { month: number; amount: number }[] = [];
  const insuranceCashflows: { month: number; amount: number }[] = [];

  if (globalParams.initialCapital > 0) {
    depotCashflows.push({ month: 0, amount: -globalParams.initialCapital });
    insuranceCashflows.push({ month: 0, amount: -globalParams.initialCapital });
  }

  let totalNetPayoutDepot = 0;
  let totalNetPayoutInsurance = 0;

  for (let i = 0; i < history.length; i++) {
    const point = history[i];
    if (!point) continue;

    const monthNum = point.month;

    if (point.phase === "ACCUMULATION") {
      // Investor contributions out of pocket
      // Note: Advance tax is paid externally out-of-pocket only when advanceTaxFundingSource === 'EXTERNAL_CASH'.
      // If advanceTaxFundingSource === 'SELL_SHARES', the tax is funded within the depot by redeeming shares.
      const externalAdvanceTax =
        depotParams.advanceTaxFundingSource === "EXTERNAL_CASH"
          ? point.depotTaxes
          : 0;
      const depotOutflow = point.depotGrossCashflow + externalAdvanceTax;
      if (depotOutflow > 0) {
        depotCashflows.push({ month: monthNum, amount: -depotOutflow });
      }

      if (point.insuranceGrossCashflow > 0) {
        insuranceCashflows.push({
          month: monthNum,
          amount: -point.insuranceGrossCashflow,
        });
      }
    } else {
      // Payout phase: Inflows into investor's bank account
      const depotInflow = Math.abs(point.depotNetCashflow);
      const insuranceInflow = Math.abs(point.insuranceNetCashflow);

      totalNetPayoutDepot += depotInflow;
      totalNetPayoutInsurance += insuranceInflow;

      if (depotInflow > 0) {
        depotCashflows.push({ month: monthNum, amount: depotInflow });
      }
      if (insuranceInflow > 0) {
        insuranceCashflows.push({ month: monthNum, amount: insuranceInflow });
      }
    }

    // Terminal value at the final month
    if (i === history.length - 1) {
      if (point.depotValueNet > 0) {
        depotCashflows.push({ month: monthNum, amount: point.depotValueNet });
      }
      if (point.insuranceValueNet > 0) {
        insuranceCashflows.push({
          month: monthNum,
          amount: point.insuranceValueNet,
        });
      }
    }
  }

  const depotIrrPa = calculateXirr(depotCashflows);
  const insuranceIrrPa = calculateXirr(insuranceCashflows);

  // 2. Break-Even Age
  const breakEven = calculateBreakEvenAge(history, globalParams.ageStart);

  // 3. Net Liquidation / Surrender Value at Retirement Start
  const accumulationDurationYears =
    globalParams.ageRetirement - globalParams.ageStart;
  const retirementCapitalInvested = retirementPoint?.investedCapital || 0;

  const depotLiquidationValueAtRetirement =
    retirementPoint?.depotValueNet !== undefined
      ? retirementPoint.depotValueNet
      : calculateDepotLiquidationValue(
          retirementPoint?.depotValue || 0,
          retirementCapitalInvested,
          depotParams.partialTaxExemptionRate,
          taxParams.taxAllowanceTotal,
          effectiveTaxRate,
        );

  const insuranceLiquidationValueAtRetirement =
    retirementPoint?.insuranceValueNet !== undefined
      ? retirementPoint.insuranceValueNet
      : calculateInsuranceLiquidationValue(
          retirementPoint?.insuranceValue || 0,
          retirementCapitalInvested,
          insuranceParams.insurancePartialTaxExemptionRate,
          insuranceParams.halfIncomeProcedureActive,
          accumulationDurationYears,
          globalParams.ageRetirement,
          taxParams.taxAllowanceTotal,
          taxParams.marginalTaxRateRetirement,
          effectiveTaxRate,
        );

  // 4. Implicit Rentenfaktor
  // Use first payout month's net payout or target withdrawal
  const firstPayoutPoint =
    retirementIndex >= 0 ? history[retirementIndex] : undefined;
  const depotFirstMonthNetPayout = firstPayoutPoint
    ? Math.abs(firstPayoutPoint.depotNetCashflow)
    : payoutParams.withdrawalValue;
  const insuranceFirstMonthNetPayout = firstPayoutPoint
    ? Math.abs(firstPayoutPoint.insuranceNetCashflow)
    : payoutParams.withdrawalValue;

  const depotImplicitRentenfaktor = calculateImplicitRentenfaktor(
    depotFirstMonthNetPayout,
    depotLiquidationValueAtRetirement,
  );

  const insuranceImplicitRentenfaktor = calculateImplicitRentenfaktor(
    insuranceFirstMonthNetPayout,
    insuranceLiquidationValueAtRetirement,
  );

  // 5. Total Net Payout Sum
  const totalNetPayoutDiff = totalNetPayoutDepot - totalNetPayoutInsurance;

  return {
    depotIrrPa,
    insuranceIrrPa,
    irrDiffPa: depotIrrPa - insuranceIrrPa,

    breakEven,

    depotLiquidationValueAtRetirement,
    insuranceLiquidationValueAtRetirement,
    liquidationValueDiffAtRetirement:
      depotLiquidationValueAtRetirement - insuranceLiquidationValueAtRetirement,

    depotImplicitRentenfaktor,
    insuranceImplicitRentenfaktor,

    depotTotalNetPayout: totalNetPayoutDepot,
    insuranceTotalNetPayout: totalNetPayoutInsurance,
    totalNetPayoutDiff,

    depotFinalValue: lastPoint?.depotValueNet || 0,
    insuranceFinalValue: lastPoint?.insuranceValueNet || 0,
    depotTotalTaxes: history.reduce((sum, p) => sum + (p.depotTaxes || 0), 0),
    insuranceTotalTaxes: history.reduce(
      (sum, p) => sum + (p.insuranceTaxes || 0),
      0,
    ),
    depotTotalFees: history.reduce((sum, p) => sum + (p.depotFees || 0), 0),
    insuranceTotalFees: history.reduce(
      (sum, p) => sum + (p.insuranceFees || 0),
      0,
    ),
  };
}

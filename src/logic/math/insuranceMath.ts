import {
  calculateEffectiveCapitalGainsTaxRate,
  calculateTaxWithAllowance,
  calculatePortfolioValue,
} from "./commonMath";

export function calculateAlphaCost(
  monthlyContribution: number,
  totalMonths: number,
  zillmerRatePercent: number,
  remainingRatePercent: number,
  currentMonth: number,
  zillmerMonths: number = 60,
): number {
  if (monthlyContribution <= 0 || totalMonths <= 0) return 0;
  const totalContribution = monthlyContribution * totalMonths;
  let cost = 0;

  // zillmer acquisition costs (initial months)
  if (currentMonth <= zillmerMonths) {
    cost += (totalContribution * (zillmerRatePercent / 100)) / zillmerMonths;
  }

  // ongoing acquisition costs (spread over full term)
  cost += (totalContribution * (remainingRatePercent / 100)) / totalMonths;

  return cost;
}

export function calculateInsuranceNetInvestment(
  grossContribution: number,
  alphaCost: number,
  betaRatePercent: number,
  fixedCostPa: number,
): number {
  if (grossContribution <= 0) return 0;
  const betaCost = grossContribution * (betaRatePercent / 100);
  const fixedCostMonthly = fixedCostPa / 12;

  return Math.max(
    0,
    grossContribution - alphaCost - betaCost - fixedCostMonthly,
  );
}

export function calculateSpecialPaymentNetInvestment(
  specialPaymentGross: number,
  alphaSpecialRatePercent: number,
  betaSpecialRatePercent: number,
): {
  alphaCost: number;
  betaCost: number;
  totalCosts: number;
  netInvestment: number;
} {
  if (specialPaymentGross <= 0) {
    return { alphaCost: 0, betaCost: 0, totalCosts: 0, netInvestment: 0 };
  }
  const alphaCost =
    specialPaymentGross * (Math.max(0, alphaSpecialRatePercent) / 100);
  const betaCost =
    specialPaymentGross * (Math.max(0, betaSpecialRatePercent) / 100);
  const totalCosts = alphaCost + betaCost;
  const netInvestment = Math.max(0, specialPaymentGross - totalCosts);

  return { alphaCost, betaCost, totalCosts, netInvestment };
}

export function calculateGammaCostShares(
  totalShares: number,
  gammaRatePercent: number,
): number {
  if (totalShares <= 0 || gammaRatePercent <= 0) return 0;
  const gammaMonthlyRate = gammaRatePercent / 100 / 12;
  return totalShares * gammaMonthlyRate;
}

export function calculateInsuranceWithdrawalTaxAndAllowance(
  grossWithdrawal: number,
  currentTotalValue: number,
  currentTotalInvested: number,
  marginalTaxRatePercent: number,
  capitalGainsTaxRatePercent: number,
  solidaritySurchargePercent: number,
  churchTaxPercent: number,
  partialTaxExemptionPercent: number,
  halfIncomeProcedureActive: boolean,
  currentTaxAllowance: number,
): { tax: number; consumedTaxAllowance: number } {
  // no profit means no tax
  if (
    currentTotalValue <= 0 ||
    currentTotalInvested >= currentTotalValue ||
    grossWithdrawal <= 0
  ) {
    return { tax: 0, consumedTaxAllowance: 0 };
  }

  const totalGain = currentTotalValue - currentTotalInvested;
  const gainPortion = grossWithdrawal * (totalGain / currentTotalValue);

  if (halfIncomeProcedureActive) {
    // half-income rule (§ 20 Abs. 1 Nr. 6 EStG)
    const taxResult = calculateTaxWithAllowance(
      gainPortion * 0.5,
      partialTaxExemptionPercent,
      currentTaxAllowance,
      marginalTaxRatePercent / 100,
    );
    return {
      tax: taxResult.taxAmount,
      consumedTaxAllowance: taxResult.consumedAllowance,
    };
  }

  // standard capital gains tax with soli and church tax
  const appliedTaxRate = calculateEffectiveCapitalGainsTaxRate(
    capitalGainsTaxRatePercent,
    solidaritySurchargePercent,
    churchTaxPercent,
  );
  const taxResult = calculateTaxWithAllowance(
    gainPortion,
    partialTaxExemptionPercent,
    currentTaxAllowance,
    appliedTaxRate,
  );
  return {
    tax: taxResult.taxAmount,
    consumedTaxAllowance: taxResult.consumedAllowance,
  };
}

export function calculateSurplusShares(
  totalShares: number,
  surplusRatePercent: number,
): number {
  if (totalShares <= 0 || surplusRatePercent <= 0) return 0;
  const surplusMonthlyRate = surplusRatePercent / 100 / 12;
  return totalShares * surplusMonthlyRate;
}

/**
 * Calculates the gross value, gross surrender value (after deducting open unamortized alpha costs
 * if canceled during the Zillmer period), and net liquidation value (after taxes)
 * upon contract cancellation at month t.
 *
 * Mathematical valuation model:
 * 1. Gross Policy Value:
 *    grossValue = totalShares * currentSharePrice
 * 2. Gross Surrender Value (Rückkaufswert vor Steuern):
 *    surrenderValue = max(0, grossValue - unamortizedAlphaCosts - cancellationFee)
 * 3. Tax on surrender (§ 20 Abs. 1 Nr. 6 EStG):
 *    Profit = max(0, surrenderValue - totalInvested)
 *    If (currentAge >= 62 && contractDurationYears >= 12 && halfIncomeProcedureActive):
 *       Taxable Profit = Profit * 0.50 * (1 - partialTaxExemptionRate)
 *       Tax Rate = marginalTaxRateRetirement
 *    Else:
 *       Taxable Profit = Profit * (1 - partialTaxExemptionRate)
 *       Tax Rate = effectiveCapitalGainsTaxRate
 *    Latent Tax = max(0, Taxable Profit - availableTaxAllowance) * Tax Rate
 * 4. Net Liquidity Value (Auszahlungsbetrag nach Steuern):
 *    netLiquidityValue = max(0, surrenderValue - Latent Tax)
 *
 * @param totalShares - Current fund units
 * @param currentSharePrice - Current fund unit price
 * @param totalInvested - Cumulative contributions paid to date
 * @param currentMonth - Current month of simulation (1-based)
 * @param totalMonths - Total planned contract duration in months
 * @param alphaZillmerRatePercent - Alpha Zillmer acquisition cost rate (e.g. 2.5%)
 * @param alphaZillmerDurationMonths - Zillmer amortization period in months (default: 60)
 * @param partialTaxExemptionPercent - Insurance partial tax exemption rate (e.g. 15% TFS)
 * @param halfIncomeProcedureActive - Whether 12/62 Halbeinkünfteverfahren is active
 * @param currentContractDurationYears - Duration in years at month t
 * @param currentAge - Age at month t
 * @param availableTaxAllowance - Available Sparer-Pauschbetrag
 * @param marginalTaxRateRetirement - Individual marginal tax rate in retirement (%)
 * @param effectiveCapitalGainsTaxRate - Effective Abgeltungsteuer rate (decimal)
 * @param cancellationFee - Optional fixed cancellation fee in € (default: 0)
 */
export function calculateInsuranceSurrenderAndNetValue(
  totalShares: number,
  currentSharePrice: number,
  totalInvested: number,
  currentMonth: number,
  totalMonths: number,
  alphaZillmerRatePercent: number,
  alphaZillmerDurationMonths: number = 60,
  partialTaxExemptionPercent: number = 15,
  halfIncomeProcedureActive: boolean = true,
  currentContractDurationYears: number = 0,
  currentAge: number = 0,
  availableTaxAllowance: number = 0,
  marginalTaxRateRetirement: number = 25,
  effectiveCapitalGainsTaxRate: number = 0.26375,
  cancellationFee: number = 0,
): {
  insuranceGrossValue: number;
  insuranceSurrenderValue: number;
  insuranceNetLiquidityValue: number;
  latentTax: number;
} {
  const insuranceGrossValue = calculatePortfolioValue(
    currentSharePrice,
    totalShares,
  );
  if (totalShares <= 0 || currentSharePrice <= 0 || insuranceGrossValue <= 0) {
    return {
      insuranceGrossValue: 0,
      insuranceSurrenderValue: 0,
      insuranceNetLiquidityValue: 0,
      latentTax: 0,
    };
  }

  // Deduct open unamortized alpha-costs if canceled during initial Zillmer period
  let unamortizedAlpha = 0;
  if (
    currentMonth > 0 &&
    currentMonth < alphaZillmerDurationMonths &&
    totalMonths > 0
  ) {
    const remainingZillmerMonths = alphaZillmerDurationMonths - currentMonth;
    const monthlyContributionEstimate = totalInvested / currentMonth;
    const totalPlannedContributions = monthlyContributionEstimate * totalMonths;
    const totalZillmerAlpha =
      totalPlannedContributions * (alphaZillmerRatePercent / 100);
    unamortizedAlpha =
      totalZillmerAlpha * (remainingZillmerMonths / alphaZillmerDurationMonths);
  }

  const insuranceSurrenderValue = Math.max(
    0,
    insuranceGrossValue - unamortizedAlpha - cancellationFee,
  );
  const totalProfit = Math.max(0, insuranceSurrenderValue - totalInvested);

  if (totalProfit <= 0) {
    return {
      insuranceGrossValue,
      insuranceSurrenderValue,
      insuranceNetLiquidityValue: insuranceSurrenderValue,
      latentTax: 0,
    };
  }

  const qualifies1262 =
    halfIncomeProcedureActive &&
    currentContractDurationYears >= 12 &&
    currentAge >= 62;

  let latentTax = 0;
  if (qualifies1262) {
    const taxResult = calculateTaxWithAllowance(
      totalProfit * 0.5,
      partialTaxExemptionPercent,
      availableTaxAllowance,
      marginalTaxRateRetirement / 100,
    );
    latentTax = taxResult.taxAmount;
  } else {
    const taxResult = calculateTaxWithAllowance(
      totalProfit,
      partialTaxExemptionPercent,
      availableTaxAllowance,
      effectiveCapitalGainsTaxRate,
    );
    latentTax = taxResult.taxAmount;
  }

  const insuranceNetLiquidityValue = Math.max(
    0,
    insuranceSurrenderValue - latentTax,
  );

  return {
    insuranceGrossValue,
    insuranceSurrenderValue,
    insuranceNetLiquidityValue,
    latentTax,
  };
}

/**
 * Calculates the hypothetical net surrender/liquidation value of the pension insurance
 * taking into account total profit, 12/62 qualification, 15% partial tax exemption,
 * tax allowance, and applicable marginal or capital gains tax rate.
 */
export function calculateInsuranceNetValue(
  insuranceValue: number,
  totalInvested: number,
  partialTaxExemptionPercent: number,
  halfIncomeProcedureActive: boolean,
  currentContractDurationYears: number,
  currentAge: number,
  availableTaxAllowance: number,
  marginalTaxRateRetirement: number,
  effectiveCapitalGainsTaxRate: number,
): number {
  if (insuranceValue <= 0) return 0;
  const totalProfit = Math.max(0, insuranceValue - totalInvested);
  if (totalProfit <= 0) return insuranceValue;

  const qualifies1262 =
    halfIncomeProcedureActive &&
    currentContractDurationYears >= 12 &&
    currentAge >= 62;

  let latentTax = 0;
  if (qualifies1262) {
    const taxResult = calculateTaxWithAllowance(
      totalProfit * 0.5,
      partialTaxExemptionPercent,
      availableTaxAllowance,
      marginalTaxRateRetirement / 100,
    );
    latentTax = taxResult.taxAmount;
  } else {
    const taxResult = calculateTaxWithAllowance(
      totalProfit,
      partialTaxExemptionPercent,
      availableTaxAllowance,
      effectiveCapitalGainsTaxRate,
    );
    latentTax = taxResult.taxAmount;
  }

  return Math.max(0, insuranceValue - latentTax);
}

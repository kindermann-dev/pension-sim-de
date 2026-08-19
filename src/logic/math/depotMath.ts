import type { DepotTranche, DepotTaxState } from "../../types/simulation";
import {
  calculateTaxWithAllowance,
  calculatePortfolioValue,
} from "./commonMath";

export function calculateAdvanceTaxBaseYield(
  capitalAtStartOfYear: number,
  baseInterestRatePercent: number,
): number {
  const baseInterestRate = baseInterestRatePercent / 100;
  return capitalAtStartOfYear * baseInterestRate * 0.7;
}

export function sellDepotSharesFIFO(
  tranches: DepotTranche[],
  amountToSell: number,
  currentSharePrice: number,
): { updatedTranches: DepotTranche[]; taxableGain: number } {
  if (amountToSell <= 0 || currentSharePrice <= 0)
    return { updatedTranches: tranches.map((t) => ({ ...t })), taxableGain: 0 };

  let taxableGain = 0;
  let sharesToSell = amountToSell / currentSharePrice;

  const updatedTranches = tranches.map((t) => ({ ...t }));

  for (let i = 0; i < updatedTranches.length; i++) {
    const tranche = updatedTranches[i];
    if (!tranche || sharesToSell <= 0) break;

    const soldSharesFromTranche = Math.min(tranche.shares, sharesToSell);
    const rawGainPerShare = currentSharePrice - tranche.purchasePricePerShare;
    const adjustedGainPerShare = Math.max(
      0,
      rawGainPerShare - tranche.accumulatedAdvanceYieldPerShare,
    );

    taxableGain += adjustedGainPerShare * soldSharesFromTranche;

    tranche.shares -= soldSharesFromTranche;
    sharesToSell -= soldSharesFromTranche;
  }

  // remove exhausted tranches
  return {
    updatedTranches: updatedTranches.filter((t) => t.shares > 0),
    taxableGain,
  };
}

export function sellDepotShares(
  tranches: DepotTranche[],
  amountToSell: number,
  currentSharePrice: number,
  partialTaxExemptionRate: number = 0,
  taxAllowance: number = 0,
  taxRate: number = 0,
  orderFee: number = 0,
  spreadPercent: number = 0,
): {
  updatedTranches: DepotTranche[];
  taxableGain: number;
  taxableAfterExemption: number;
  taxableAfterAllowance: number;
  taxAmount: number;
  effectiveSellFee: number;
  consumedAllowance: number;
  netWithdrawal: number;
} {
  if (amountToSell <= 0 || currentSharePrice <= 0) {
    return {
      updatedTranches: tranches.map((t) => ({ ...t })),
      taxableGain: 0,
      taxableAfterExemption: 0,
      taxableAfterAllowance: 0,
      taxAmount: 0,
      effectiveSellFee: 0,
      consumedAllowance: 0,
      netWithdrawal: 0,
    };
  }

  const sellResult = sellDepotSharesFIFO(
    tranches,
    amountToSell,
    currentSharePrice,
  );
  const taxResult = calculateTaxWithAllowance(
    sellResult.taxableGain,
    partialTaxExemptionRate,
    taxAllowance,
    taxRate,
  );
  const effectiveSellFee = orderFee + amountToSell * (spreadPercent / 2 / 100);
  const netWithdrawal = Math.max(
    0,
    amountToSell - taxResult.taxAmount - effectiveSellFee,
  );

  return {
    updatedTranches: sellResult.updatedTranches,
    taxableGain: sellResult.taxableGain,
    taxableAfterExemption: taxResult.taxableAfterTFS,
    taxableAfterAllowance: taxResult.taxableAfterAllowance,
    taxAmount: taxResult.taxAmount,
    effectiveSellFee,
    consumedAllowance: taxResult.consumedAllowance,
    netWithdrawal,
  };
}

export function sellAllDepotShares(
  tranches: DepotTranche[],
  currentSharePrice: number,
  partialTaxExemptionRate: number = 0,
  taxAllowance: number = 0,
  taxRate: number = 0,
  orderFee: number = 0,
  spreadPercent: number = 0,
): {
  updatedTranches: DepotTranche[];
  taxableGain: number;
  taxableAfterExemption: number;
  taxableAfterAllowance: number;
  taxAmount: number;
  effectiveSellFee: number;
  consumedAllowance: number;
  netWithdrawal: number;
} {
  const totalShares = tranches.reduce(
    (sum, tranche) => sum + tranche.shares,
    0,
  );
  const totalAmount = totalShares * currentSharePrice;

  return sellDepotShares(
    tranches,
    totalAmount,
    currentSharePrice,
    partialTaxExemptionRate,
    taxAllowance,
    taxRate,
    orderFee,
    spreadPercent,
  );
}

export function calculateAdvanceYieldsAndUpdateTranches(
  tranches: DepotTranche[],
  startOfYearPrice: number,
  endOfYearPrice: number,
  currentSimulationMonth: number,
  baseInterestRatePercent: number,
): { totalAdvanceYield: number; updatedTranches: DepotTranche[] } {
  const currentYear = currentSimulationMonth / 12;
  const baseInterestRate = baseInterestRatePercent / 100;
  let totalAdvanceYield = 0;

  // clone tranches
  const updatedTranches = tranches.map((t) => ({ ...t }));

  for (const tranche of updatedTranches) {
    if (tranche.shares <= 0) continue;

    const trancheYear = tranche.month === 0 ? 1 : Math.ceil(tranche.month / 12);
    let startValuePerShare = 0;
    let timeFactor = 1;

    if (trancheYear < currentYear) {
      startValuePerShare = startOfYearPrice;
    } else if (trancheYear === currentYear) {
      startValuePerShare = tranche.purchasePricePerShare;
      const purchaseMonth = tranche.month === 0 ? 1 : tranche.month % 12 || 12;
      const precedingMonths = purchaseMonth - 1;
      timeFactor = (12 - precedingMonths) / 12;
    } else {
      continue;
    }

    const actualGrowthPerShare = endOfYearPrice - startValuePerShare;

    if (actualGrowthPerShare > 0) {
      // base yield per share
      const baseYieldPerShare =
        startValuePerShare * baseInterestRate * 0.7 * timeFactor;

      // advance yield per share
      const advanceYieldPerShare = Math.min(
        baseYieldPerShare,
        actualGrowthPerShare,
      );

      // track accumulated advance yield per tranche
      tranche.accumulatedAdvanceYieldPerShare += advanceYieldPerShare;

      totalAdvanceYield += advanceYieldPerShare * tranche.shares;
    }
  }

  return { totalAdvanceYield, updatedTranches };
}

/**
 * Calculates the hypothetical net liquidation value of the ETF depot if fully sold at month t.
 *
 * Mathematical valuation model:
 * 1. FIFO Capital Gains Calculation:
 *    Capital Gain = \sum (shares_i * (price_current - price_buy,i) - accumulatedAdvanceYield_i)
 * 2. Partial Tax Exemption (§ 20 InvStG, e.g. 30% TFS for equity ETFs):
 *    Taxable Gain = Capital Gain * (1 - partialTaxExemptionRate)
 * 3. Loss offset (§ 20 Abs. 6 EStG) against general loss carryforward pot:
 *    Taxable after Loss = max(0, Taxable Gain - lossCarryforward)
 * 4. Sparer-Pauschbetrag (§ 20 Abs. 9 EStG):
 *    Taxable Final = max(0, Taxable after Loss - remainingTaxAllowance)
 * 5. Latent Capital Gains Tax:
 *    Tax = Taxable Final * effectiveTaxRate
 * 6. Net Liquidity Value:
 *    netLiquidityValue = grossValue - Tax - sellOrderFee - spread
 *
 * @param tranches - FIFO tranches of depot shares
 * @param currentSharePrice - Current market price per share
 * @param partialTaxExemptionPercent - Partial tax exemption percentage (e.g. 30)
 * @param taxState - Current tax allowance and loss carryforward state
 * @param effectiveTaxRate - Effective Abgeltungsteuer rate (including Soli and Church tax)
 * @param sellOrderFee - Optional fixed sell order fee in € (default 0)
 * @param spreadPercent - Optional bid-ask spread percentage (default 0)
 */
export function calculateDepotLiquidationValue(
  tranches: readonly DepotTranche[],
  currentSharePrice: number,
  partialTaxExemptionPercent: number,
  taxState: DepotTaxState,
  effectiveTaxRate: number,
  sellOrderFee: number = 0,
  spreadPercent: number = 0,
): {
  grossValue: number;
  netLiquidityValue: number;
  latentTax: number;
  effectiveSellFee: number;
  remainingTaxAllowance: number;
  lossCarryforward: number;
} {
  const grossValue = calculateDepotValue(currentSharePrice, tranches);
  if (tranches.length === 0 || currentSharePrice <= 0 || grossValue <= 0) {
    return {
      grossValue: 0,
      netLiquidityValue: 0,
      latentTax: 0,
      effectiveSellFee: 0,
      remainingTaxAllowance: taxState.remainingTaxAllowance,
      lossCarryforward: taxState.lossCarryforward,
    };
  }

  let totalTaxableGain = 0;
  let totalCapitalLoss = 0;

  for (const tranche of tranches) {
    if (tranche.shares <= 0) continue;

    const rawGainPerShare = currentSharePrice - tranche.purchasePricePerShare;
    const adjustedGainPerShare = Math.max(
      0,
      rawGainPerShare - tranche.accumulatedAdvanceYieldPerShare,
    );
    totalTaxableGain += adjustedGainPerShare * tranche.shares;

    if (rawGainPerShare < 0) {
      totalCapitalLoss += Math.abs(rawGainPerShare) * tranche.shares;
    }
  }

  const exemptionRate = partialTaxExemptionPercent / 100;
  let latentTax = 0;
  let newLossCarryforward = taxState.lossCarryforward;
  let newTaxAllowance = taxState.remainingTaxAllowance;

  if (totalTaxableGain > 0) {
    const taxableAfterTfs = totalTaxableGain * (1 - exemptionRate);

    // 1. Offset against loss carryforward pot (§ 20 Abs. 6 EStG)
    const consumedLoss = Math.min(taxableAfterTfs, newLossCarryforward);
    const taxableAfterLoss = taxableAfterTfs - consumedLoss;
    newLossCarryforward -= consumedLoss;

    // 2. Offset against remaining Sparer-Pauschbetrag (§ 20 Abs. 9 EStG)
    const consumedAllowance = Math.min(taxableAfterLoss, newTaxAllowance);
    const taxableFinal = Math.max(0, taxableAfterLoss - consumedAllowance);
    newTaxAllowance -= consumedAllowance;

    latentTax = taxableFinal * effectiveTaxRate;
  } else if (totalCapitalLoss > 0) {
    const lossAfterTfs = totalCapitalLoss * (1 - exemptionRate);
    newLossCarryforward += lossAfterTfs;
  }

  const effectiveSellFee =
    grossValue > 0 && (sellOrderFee > 0 || spreadPercent > 0)
      ? sellOrderFee + grossValue * (spreadPercent / 2 / 100)
      : 0;
  const netLiquidityValue = Math.max(
    0,
    grossValue - latentTax - effectiveSellFee,
  );

  return {
    grossValue,
    netLiquidityValue,
    latentTax,
    effectiveSellFee,
    remainingTaxAllowance: newTaxAllowance,
    lossCarryforward: newLossCarryforward,
  };
}

/**
 * Calculates the hypothetical net liquidation value of the ETF depot
 * by computing the latent capital gains tax on all unrealized gains across FIFO tranches,
 * deducting accumulated advance yields and applying partial tax exemption and available tax allowance.
 */
export function calculateDepotNetValue(
  tranches: readonly DepotTranche[],
  currentSharePrice: number,
  partialTaxExemptionPercent: number,
  availableTaxAllowance: number,
  effectiveTaxRate: number,
): number {
  const result = calculateDepotLiquidationValue(
    tranches,
    currentSharePrice,
    partialTaxExemptionPercent,
    { remainingTaxAllowance: availableTaxAllowance, lossCarryforward: 0 },
    effectiveTaxRate,
  );
  return result.netLiquidityValue;
}

export function calculateDepotValue(
  sharePrice: number,
  tranches: readonly DepotTranche[],
): number {
  let totalShares = 0;
  for (let i = 0; i < tranches.length; i++) {
    const tranche = tranches[i];
    if (tranche) {
      totalShares += tranche.shares;
    }
  }
  return calculatePortfolioValue(sharePrice, totalShares);
}

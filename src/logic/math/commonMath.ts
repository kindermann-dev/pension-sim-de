export function calculateMonthlyReturnRate(
  annualReturnRatePercent: number,
): number {
  const decimalRate = annualReturnRatePercent / 100;
  return Math.pow(1 + decimalRate, 1 / 12) - 1;
}

export function calculateNetInvestment(
  grossInvestment: number,
  absoluteFee: number,
  relativeFeePercent: number,
): number {
  if (grossInvestment <= 0) return 0;
  const relativeFeeDecimal = relativeFeePercent / 100;
  return Math.max(
    0,
    grossInvestment - absoluteFee - grossInvestment * relativeFeeDecimal,
  );
}

export function calculateSharesToBuy(
  netInvestment: number,
  currentSharePrice: number,
): number {
  if (currentSharePrice <= 0 || netInvestment <= 0) return 0;
  return netInvestment / currentSharePrice;
}

export function applyDynamics(
  currentRate: number,
  dynamicsRatePercent: number,
): number {
  const decimalRate = dynamicsRatePercent / 100;
  return currentRate * (1 + decimalRate);
}

export function calculateEffectiveCapitalGainsTaxRate(
  capitalGainsTaxRatePercent: number,
  solidaritySurchargePercent: number,
  churchTaxPercent: number,
): number {
  const cgTaxRate = capitalGainsTaxRatePercent / 100;
  const soliRate = solidaritySurchargePercent / 100;
  const churchRate = churchTaxPercent / 100;

  // German Abgeltungsteuer formula according to § 32d Abs. 1 S. 3 EStG (church tax deductibility)
  const baseTaxRate = cgTaxRate / (1 + cgTaxRate * churchRate);
  return baseTaxRate * (1 + soliRate + churchRate);
}

export function calculatePricePerformance(
  price: number,
  returnRate: number,
): number {
  return price * (1 + returnRate);
}

export function calculatePortfolioValue(
  sharePrice: number,
  totalShares: number,
): number {
  if (sharePrice <= 0 || totalShares <= 0) return 0;
  return sharePrice * totalShares;
}

export interface TaxCalculationResult {
  taxableAfterTFS: number;
  taxableAfterAllowance: number;
  taxAmount: number;
  consumedAllowance: number;
}

export function calculateTaxWithAllowance(
  taxable: number,
  partialTaxExemptionPercent: number,
  availableTaxAllowance: number,
  effectiveTaxRate: number,
): TaxCalculationResult {
  if (taxable <= 0) {
    return {
      taxableAfterTFS: 0,
      taxableAfterAllowance: 0,
      taxAmount: 0,
      consumedAllowance: 0,
    };
  }

  const exemptionRate = partialTaxExemptionPercent / 100;
  const taxableAfterTFS = taxable * (1 - exemptionRate);
  const consumedAllowance = Math.min(taxableAfterTFS, availableTaxAllowance);
  const taxableAfterAllowance = Math.max(
    0,
    taxableAfterTFS - consumedAllowance,
  );
  const taxAmount = taxableAfterAllowance * effectiveTaxRate;

  return {
    taxableAfterTFS,
    taxableAfterAllowance,
    taxAmount,
    consumedAllowance,
  };
}

export function formatCurrency(val: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(val);
}

export interface DepotTranche {
  month: number;
  shares: number;
  purchasePricePerShare: number;
  accumulatedAdvanceYieldPerShare: number;
}

export interface DepotTaxState {
  remainingTaxAllowance: number; // Sparerpauschbetrag for current year
  lossCarryforward: number; // Verlustverrechnungstopf (§ 20 Abs. 6 EStG)
}

export interface DepotState {
  currentSharePrice: number;
  tranches: DepotTranche[];
  totalInvested: number;
  totalValue: number;
  totalTaxPaid: number;
  totalExternalTaxPaid?: number; // Out-of-pocket Vorabpauschale from clearing account
  lossCarryforward?: number; // Verlustverrechnungstopf
  prevYearStartPrice: number;
  prevYearEndPrice: number;
}

export interface InsuranceState {
  currentSharePrice: number;
  totalShares: number;
  totalInvested: number;
  totalValue: number;
  totalTaxPaid: number;
}

export interface BreakdownRow {
  label: string;
  value: string;
  isTotal?: boolean;
}

export interface DetailBreakdown {
  title: string;
  rows: BreakdownRow[];
}

export interface LifecycleDataPoint {
  month: number;
  year: number;
  phase?: "ACCUMULATION" | "PAYOUT";
  investedCapital: number;
  portfolioValue: number;
  netPortfolioValue: number;
  grossCashflow: number; // positive (deposit) or negative (withdrawal)
  netCashflow: number; // effective amount added to portfolio or received in bank account
  feesPaid: number; // order fees, depot fees, alpha/beta/gamma insurance costs
  taxesPaid: number; // advance tax or capital gains tax
  taxAllowanceUsed: number;
  cumExternalTaxPaid?: number;
  surrenderValue?: number;
  feeBreakdown?: DetailBreakdown;
  taxBreakdown?: DetailBreakdown;
}

export interface CombinedDataPoint {
  month: number;
  year: number;
  phase: "ACCUMULATION" | "PAYOUT";
  investedCapital: number;

  depotValue: number;
  depotValueNet: number;
  depotTotalCashInvested?: number;
  depotGrossCashflow: number;
  depotNetCashflow: number;
  depotFees: number;
  depotTaxes: number;
  depotTaxAllowanceUsed: number;
  depotCumExternalTaxPaid?: number;
  depotFeeBreakdown?: DetailBreakdown;
  depotTaxBreakdown?: DetailBreakdown;

  insuranceValue: number;
  insuranceSurrenderValue?: number;
  insuranceValueNet: number;
  insuranceGrossCashflow: number;
  insuranceNetCashflow: number;
  insuranceFees: number;
  insuranceTaxes: number;
  insuranceTaxAllowanceUsed: number;
  insuranceFeeBreakdown?: DetailBreakdown;
  insuranceTaxBreakdown?: DetailBreakdown;
}

export interface BreakEvenResult {
  reached: boolean;
  ageYears: number | null;
  ageMonths: number | null;
  month: number | null;
  description: string;
}

export interface SimulationKPIs {
  // 1. Net-IRR / XIRR (Internal Rate of Return p.a. after all taxes and costs)
  depotIrrPa: number;
  insuranceIrrPa: number;
  irrDiffPa: number;

  // 2. Break-Even Age (Intersection of overall profitability)
  breakEven: BreakEvenResult;

  // 3. Net Liquidity Value / Surrender Value (at retirement start)
  depotLiquidationValueAtRetirement: number;
  insuranceLiquidationValueAtRetirement: number;
  liquidationValueDiffAtRetirement: number;

  // 4. Implicit Pension Factor (monthly net payout per 10,000 € capital at retirement)
  depotImplicitRentenfaktor: number;
  insuranceImplicitRentenfaktor: number;

  // 5. Total Net Payout Sum
  depotTotalNetPayout: number;
  insuranceTotalNetPayout: number;
  totalNetPayoutDiff: number;

  // Final Terminal & Summary Metrics
  depotFinalValue: number;
  insuranceFinalValue: number;
  depotTotalTaxes: number;
  insuranceTotalTaxes: number;
  depotTotalFees: number;
  insuranceTotalFees: number;
}

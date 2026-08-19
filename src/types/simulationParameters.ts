export type WithdrawalInterval = "MONTHLY" | "YEARLY" | "TRANCHES";

export type WithdrawalType = "ABSOLUTE_AMOUNT" | "PERCENTAGE_OF_REMAINING";

export interface GlobalParameters {
  ageStart: number; // int
  ageRetirement: number; // int
  initialCapital: number; // float (€)
  monthlySavings: number; // float (€)
  savingsDynamicsPa: number; // float (%) - used when savingsDynamicsLinkedToInflation === false
  savingsDynamicsLinkedToInflation: boolean;
  marketReturnPa: number; // float (%)
  inflationRatePa: number; // float (%)
  baseInterestRateAdvanceTax: number; // float (%)
  fundSwitchIntervalYears: number; // int (0 = disabled, e.g. 5, 7, 10 years)
}

export interface TaxParameters {
  taxAllowanceTotal: number; // float (€)
  capitalGainsTaxRate: number; // float (%)
  solidaritySurchargeRate: number; // float (%)
  churchTaxRate: number; // float (%)
  marginalTaxRateRetirement: number; // float (%)
  enableAdvanceTax: boolean;
}

export interface DepotParameters {
  trackingDifferencePa: number; // float (%)
  buyOrderFeeAbsolute: number; // float (€)
  buyOrderFeeRelative: number; // float (%)
  depotSellOrderFee: number; // float (€)
  spreadPercent: number;
  depotFeePa: number; // float (€)
  partialTaxExemptionRate: number; // float (%)
  isAccumulating: boolean;
  dividendYieldPa: number; // float (%) - only relevant if isAccumulating === false
  advanceTaxFundingSource:
    "SELL_SHARES" | "EXTERNAL_CASH" | "MATCHED_POLICE_CONTRIBUTION";
}

export interface InsuranceParameters {
  alphaCostZillmerRate: number;
  alphaCostDurationYears: number;
  alphaCostRemainingRate: number;
  betaCostContributionRate: number;
  adminCostCapitalPaAccumulation: number;
  adminCostCapitalPaPayout: number;
  betaCostFixedPa: number;
  trackingDifferencePa: number;
  surplusParticipationRatePa: number;
  insurancePartialTaxExemptionRate: number;
  halfIncomeProcedureActive: boolean;
  insuranceFundSwitchFee: number; // float (€ per switch)
  alphaCostSpecialPaymentRate: number; // float (%) - Abschluss- und Vertriebskosten auf Zuzahlungen
  betaCostSpecialPaymentRate: number; // float (%) - Verwaltungskosten auf Zuzahlungen
}

export interface WithdrawalPlanParameters {
  withdrawalInterval: "MONTHLY" | "YEARLY";
  withdrawalType: "ABSOLUTE_AMOUNT" | "PERCENTAGE";
  withdrawalValue: number;
  withdrawalIsNet: boolean;
  withdrawalDurationYears: number;
  withdrawalDynamicsPa: number; // float (%) - used when withdrawalDynamicsLinkedToInflation === false
  withdrawalDynamicsLinkedToInflation: boolean;
  insuranceWithdrawalFeeRate: number;
  insuranceWithdrawalFeeMaxAbsolute: number;
}

export interface AnnuityParameters {
  guaranteedPensionFactor: number; // float (per 10.000€)
  projectedPensionFactor: number; // float (per 10.000€)
  taxableYieldShareRate: number; // float (%)
  guaranteePeriodYears: number; // int
}

export interface PayoutPhaseParameters {
  withdrawalPlan: WithdrawalPlanParameters;
  annuity: AnnuityParameters;
}

// Master Interface for the entire configuration state
export interface SimulationConfiguration {
  global: GlobalParameters;
  tax: TaxParameters;
  depot: DepotParameters;
  insurance: InsuranceParameters;
  payout: PayoutPhaseParameters;
}

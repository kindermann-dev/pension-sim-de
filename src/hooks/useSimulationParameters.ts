import { useState, useCallback } from "react";
import type {
  GlobalParameters,
  DepotParameters,
  TaxParameters,
  InsuranceParameters,
  WithdrawalPlanParameters,
} from "../types/simulationParameters";

export const INITIAL_GLOBAL_PARAMETERS: GlobalParameters = {
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

export const INITIAL_DEPOT_PARAMETERS: DepotParameters = {
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

export const INITIAL_TAX_PARAMETERS: TaxParameters = {
  taxAllowanceTotal: 1000,
  capitalGainsTaxRate: 25,
  solidaritySurchargeRate: 5.5,
  churchTaxRate: 0,
  marginalTaxRateRetirement: 29,
  enableAdvanceTax: true,
};

export const INITIAL_INSURANCE_PARAMETERS: InsuranceParameters = {
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

export const INITIAL_PAYOUT_PARAMETERS: WithdrawalPlanParameters = {
  withdrawalInterval: "MONTHLY",
  withdrawalType: "ABSOLUTE_AMOUNT",
  withdrawalValue: 1000,
  withdrawalIsNet: true,
  withdrawalDurationYears: 30,
  withdrawalDynamicsPa: 2,
  withdrawalDynamicsLinkedToInflation: true,
  insuranceWithdrawalFeeRate: 1.0,
  insuranceWithdrawalFeeMaxAbsolute: 50.0,
};

export function useSimulationParameters() {
  const [globalParams, setGlobalParams] = useState<GlobalParameters>(
    INITIAL_GLOBAL_PARAMETERS,
  );
  const [depotParams, setDepotParams] = useState<DepotParameters>(
    INITIAL_DEPOT_PARAMETERS,
  );
  const [taxParams, setTaxParams] = useState<TaxParameters>(
    INITIAL_TAX_PARAMETERS,
  );
  const [insuranceParams, setInsuranceParams] = useState<InsuranceParameters>(
    INITIAL_INSURANCE_PARAMETERS,
  );
  const [payoutParams, setPayoutParams] = useState<WithdrawalPlanParameters>(
    INITIAL_PAYOUT_PARAMETERS,
  );

  const resetToDefaults = useCallback(() => {
    setGlobalParams(INITIAL_GLOBAL_PARAMETERS);
    setDepotParams(INITIAL_DEPOT_PARAMETERS);
    setTaxParams(INITIAL_TAX_PARAMETERS);
    setInsuranceParams(INITIAL_INSURANCE_PARAMETERS);
    setPayoutParams(INITIAL_PAYOUT_PARAMETERS);
  }, []);

  return {
    globalParams,
    setGlobalParams,
    depotParams,
    setDepotParams,
    taxParams,
    setTaxParams,
    insuranceParams,
    setInsuranceParams,
    payoutParams,
    setPayoutParams,
    resetToDefaults,
  };
}

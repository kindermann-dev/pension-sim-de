import type { InsuranceParameters } from "../../types/simulationParameters";
import { NumInput } from "./NumInput";
import { CheckInput } from "./CheckInput";

interface InsuranceSectionProps {
  insuranceParams: InsuranceParameters;
  insuranceWithdrawalFeeRate: number;
  onUpdateInsurance: (
    key: keyof InsuranceParameters,
    value: number | boolean,
  ) => void;
  onUpdateWithdrawalFeeRate: (rate: number) => void;
}

export const InsuranceSection = ({
  insuranceParams,
  insuranceWithdrawalFeeRate,
  onUpdateInsurance,
  onUpdateWithdrawalFeeRate,
}: InsuranceSectionProps) => {
  return (
    <div className="bg-purple-50 p-4 rounded border border-purple-200">
      <h3 className="font-bold text-gray-700 mb-4 border-b pb-2 border-purple-300">
        Rentenversicherung
      </h3>
      <NumInput
        label="Tracking Diff. p.a."
        value={insuranceParams.trackingDifferencePa}
        onChange={(v) => onUpdateInsurance("trackingDifferencePa", v)}
        symbol="%"
      />
      <NumInput
        label="Alpha Zillmer (J. 1-5)"
        value={insuranceParams.alphaCostZillmerRate}
        onChange={(v) => onUpdateInsurance("alphaCostZillmerRate", v)}
        symbol="%"
      />
      <NumInput
        label="Alpha Rest (Laufzeit)"
        value={insuranceParams.alphaCostRemainingRate}
        onChange={(v) => onUpdateInsurance("alphaCostRemainingRate", v)}
        symbol="%"
      />
      <NumInput
        label="Beta (auf Beitrag)"
        value={insuranceParams.betaCostContributionRate}
        onChange={(v) => onUpdateInsurance("betaCostContributionRate", v)}
        symbol="%"
      />
      <NumInput
        label="Alpha Zuzahlung"
        value={insuranceParams.alphaCostSpecialPaymentRate}
        onChange={(v) => onUpdateInsurance("alphaCostSpecialPaymentRate", v)}
        symbol="%"
      />
      <NumInput
        label="Beta Zuzahlung"
        value={insuranceParams.betaCostSpecialPaymentRate}
        onChange={(v) => onUpdateInsurance("betaCostSpecialPaymentRate", v)}
        symbol="%"
      />
      <NumInput
        label="Gamma (Ansparphase)"
        value={insuranceParams.adminCostCapitalPaAccumulation}
        onChange={(v) => onUpdateInsurance("adminCostCapitalPaAccumulation", v)}
        symbol="% p.a."
      />
      <NumInput
        label="Gamma (Auszahlphase)"
        value={insuranceParams.adminCostCapitalPaPayout}
        onChange={(v) => onUpdateInsurance("adminCostCapitalPaPayout", v)}
        symbol="% p.a."
      />
      <NumInput
        label="Überschussbeteiligung"
        value={insuranceParams.surplusParticipationRatePa}
        onChange={(v) => onUpdateInsurance("surplusParticipationRatePa", v)}
        symbol="% p.a."
      />
      <NumInput
        label="Stückkosten Entnahme"
        value={insuranceWithdrawalFeeRate}
        onChange={(v) => onUpdateWithdrawalFeeRate(v)}
        symbol="%"
      />
      <NumInput
        label="Fondswechsel-Gebühr"
        value={insuranceParams.insuranceFundSwitchFee}
        onChange={(v) => onUpdateInsurance("insuranceFundSwitchFee", v)}
        symbol="€"
      />
      <CheckInput
        label="Halbeinkünfteverfahren"
        checked={insuranceParams.halfIncomeProcedureActive}
        onChange={(v) => onUpdateInsurance("halfIncomeProcedureActive", v)}
      />
    </div>
  );
};

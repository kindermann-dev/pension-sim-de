import type { TaxParameters } from "../../types/simulationParameters";
import { NumInput } from "./NumInput";
import { CheckInput } from "./CheckInput";

interface TaxSectionProps {
  taxParams: TaxParameters;
  baseInterestRateAdvanceTax: number;
  onUpdateTax: (key: keyof TaxParameters, value: number | boolean) => void;
  onUpdateBaseInterestRate: (rate: number) => void;
}

export const TaxSection = ({
  taxParams,
  baseInterestRateAdvanceTax,
  onUpdateTax,
  onUpdateBaseInterestRate,
}: TaxSectionProps) => {
  return (
    <div className="bg-red-50 p-4 rounded border border-red-200">
      <h3 className="font-bold text-gray-700 mb-4 border-b pb-2 border-red-300">
        Steuern & Freibeträge
      </h3>
      <NumInput
        label="Kapitalertragsteuer"
        value={taxParams.capitalGainsTaxRate}
        onChange={(v) => onUpdateTax("capitalGainsTaxRate", v)}
        symbol="%"
      />
      <NumInput
        label="Soli"
        value={taxParams.solidaritySurchargeRate}
        onChange={(v) => onUpdateTax("solidaritySurchargeRate", v)}
        symbol="%"
      />
      <NumInput
        label="Kirchensteuer"
        value={taxParams.churchTaxRate}
        onChange={(v) => onUpdateTax("churchTaxRate", v)}
        symbol="%"
      />
      <NumInput
        label="Pers. Steuersatz (Rente)"
        value={taxParams.marginalTaxRateRetirement}
        onChange={(v) => onUpdateTax("marginalTaxRateRetirement", v)}
        symbol="%"
      />
      <NumInput
        label="Freistellungsauftrag"
        value={taxParams.taxAllowanceTotal}
        onChange={(v) => onUpdateTax("taxAllowanceTotal", v)}
        symbol="€"
      />
      <NumInput
        label="Basiszins (Vorabpauschale)"
        value={baseInterestRateAdvanceTax}
        onChange={(v) => onUpdateBaseInterestRate(v)}
        symbol="%"
      />
      <CheckInput
        label="Vorabpauschale"
        checked={taxParams.enableAdvanceTax}
        onChange={(v) => onUpdateTax("enableAdvanceTax", v)}
      />
    </div>
  );
};

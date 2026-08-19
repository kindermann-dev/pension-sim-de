import type { GlobalParameters } from "../../types/simulationParameters";
import { NumInput } from "./NumInput";
import { CheckInput } from "./CheckInput";

interface GlobalSectionProps {
  globalParams: GlobalParameters;
  onUpdate: (key: keyof GlobalParameters, value: number | boolean) => void;
}

export const GlobalSection = ({
  globalParams,
  onUpdate,
}: GlobalSectionProps) => {
  return (
    <div className="bg-gray-50 p-4 rounded border border-gray-200">
      <h3 className="font-bold text-gray-700 mb-4 border-b pb-2">Allgemein</h3>
      <NumInput
        label="Startalter"
        value={globalParams.ageStart}
        onChange={(v) => onUpdate("ageStart", v)}
      />
      <NumInput
        label="Rentenalter"
        value={globalParams.ageRetirement}
        onChange={(v) => onUpdate("ageRetirement", v)}
      />
      <NumInput
        label="Startkapital"
        value={globalParams.initialCapital}
        onChange={(v) => onUpdate("initialCapital", v)}
        symbol="€"
      />
      <NumInput
        label="Sparrate (Mtl.)"
        value={globalParams.monthlySavings}
        onChange={(v) => onUpdate("monthlySavings", v)}
        symbol="€"
      />
      <NumInput
        label="Inflationsrate p.a."
        value={globalParams.inflationRatePa}
        onChange={(v) => onUpdate("inflationRatePa", v)}
        symbol="%"
      />
      <NumInput
        label="Marktrendite p.a."
        value={globalParams.marketReturnPa}
        onChange={(v) => onUpdate("marketReturnPa", v)}
        symbol="%"
      />

      <div className="pt-2 border-t border-gray-200">
        <CheckInput
          label="Sparrate an Inflation koppeln"
          checked={globalParams.savingsDynamicsLinkedToInflation}
          onChange={(v) => onUpdate("savingsDynamicsLinkedToInflation", v)}
        />
        {globalParams.savingsDynamicsLinkedToInflation ? (
          <p className="text-xs text-gray-500 italic -mt-2 mb-2">
            Dynamik: {globalParams.inflationRatePa}% p.a. (gekoppelt)
          </p>
        ) : (
          <NumInput
            label="Eigene Sparraten-Dynamik"
            value={globalParams.savingsDynamicsPa}
            onChange={(v) => onUpdate("savingsDynamicsPa", v)}
            symbol="%"
          />
        )}
      </div>

      <div className="pt-2 border-t border-gray-200">
        <NumInput
          label="Fondswechsel-Intervall"
          value={globalParams.fundSwitchIntervalYears}
          onChange={(v) => onUpdate("fundSwitchIntervalYears", v)}
          symbol="Jahre"
        />
        <p className="text-[11px] text-gray-500 italic -mt-2">
          {globalParams.fundSwitchIntervalYears > 0
            ? `Umschichtung alle ${globalParams.fundSwitchIntervalYears} J. (Depot: Abgeltungsteuer; Police: steuerfrei)`
            : "0 = Deaktiviert (keine Umschichtungen)"}
        </p>
      </div>
    </div>
  );
};

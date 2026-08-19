import type { WithdrawalPlanParameters } from "../../types/simulationParameters";
import { NumInput } from "./NumInput";
import { CheckInput } from "./CheckInput";

interface PayoutSectionProps {
  payoutParams: WithdrawalPlanParameters;
  inflationRatePa: number;
  onUpdate: (
    key: keyof WithdrawalPlanParameters,
    value: number | boolean,
  ) => void;
}

export const PayoutSection = ({
  payoutParams,
  inflationRatePa,
  onUpdate,
}: PayoutSectionProps) => {
  return (
    <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
      <h3 className="font-bold text-gray-700 mb-4 border-b pb-2 border-yellow-300">
        Entnahmeplan
      </h3>
      <NumInput
        label="Wunschrente (Mtl.)"
        value={payoutParams.withdrawalValue}
        onChange={(v) => onUpdate("withdrawalValue", v)}
        symbol="€"
      />

      <CheckInput
        label="Wunschrente ist Netto (nach Steuern)"
        checked={payoutParams.withdrawalIsNet}
        onChange={(v) => onUpdate("withdrawalIsNet", v)}
        tooltip={
          <div className="space-y-1.5">
            <p className="font-semibold text-white">
              Logik der Netto-Auszahlung:
            </p>
            <p>
              <strong className="text-blue-300">Aktiviert (Netto):</strong> Die
              Wunschrente soll nach Abzug aller Steuern (Kapitalertragsteuer
              bzw. Halbeinkünfteverfahren) und Gebühren tatsächlich auf Ihrem
              Konto landen. Das Portfolio berechnet dafür dynamisch den
              benötigten höheren Brutto-Verkaufsbetrag (Steuer-Gross-Up).
            </p>
            <p>
              <strong className="text-gray-300">Deaktiviert (Brutto):</strong>{" "}
              Die Wunschrente wird als fixer Bruttobetrag aus dem Portfolio
              entnommen. Anfallende Steuern und Gebühren werden davon abgezogen,
              wodurch die reale Auszahlung auf Ihr Konto geringer ausfällt.
            </p>
          </div>
        }
      />

      <NumInput
        label="Dauer der Entnahme"
        value={payoutParams.withdrawalDurationYears}
        onChange={(v) => onUpdate("withdrawalDurationYears", v)}
        symbol="Jahre"
      />

      <div className="pt-2 border-t border-yellow-300">
        <CheckInput
          label="Rente an Inflation koppeln"
          checked={payoutParams.withdrawalDynamicsLinkedToInflation}
          onChange={(v) => onUpdate("withdrawalDynamicsLinkedToInflation", v)}
          tooltip="Erhöht die monatliche Auszahlung jährlich um die allgemeine Inflationsrate, um die reale Kaufkraft über die gesamte Rentenphase hinweg zu erhalten."
        />
        {payoutParams.withdrawalDynamicsLinkedToInflation ? (
          <p className="text-xs text-gray-500 italic -mt-2 mb-2">
            Dynamik: {inflationRatePa}% p.a. (gekoppelt)
          </p>
        ) : (
          <NumInput
            label="Eigene Renten-Dynamik"
            value={payoutParams.withdrawalDynamicsPa}
            onChange={(v) => onUpdate("withdrawalDynamicsPa", v)}
            symbol="%"
          />
        )}
      </div>
    </div>
  );
};

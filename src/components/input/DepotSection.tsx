import type { DepotParameters } from "../../types/simulationParameters";
import { NumInput } from "./NumInput";
import { CheckInput } from "./CheckInput";

interface DepotSectionProps {
  depotParams: DepotParameters;
  onUpdateDepot: (
    key: keyof DepotParameters,
    value: number | boolean | string,
  ) => void;
}

export const DepotSection = ({
  depotParams,
  onUpdateDepot,
}: DepotSectionProps) => {
  const fundingSource = depotParams.advanceTaxFundingSource ?? "SELL_SHARES";

  return (
    <div className="bg-blue-50 p-4 rounded border border-blue-200 space-y-3">
      <h3 className="font-bold text-gray-700 border-b pb-2 border-blue-300">
        ETF-Depot
      </h3>
      <NumInput
        label="Tracking Diff. p.a."
        value={depotParams.trackingDifferencePa}
        onChange={(v) => onUpdateDepot("trackingDifferencePa", v)}
        symbol="%"
      />
      <NumInput
        label="Spread"
        value={depotParams.spreadPercent}
        onChange={(v) => onUpdateDepot("spreadPercent", v)}
        symbol="%"
      />
      <NumInput
        label="Kauf-Ordergebühr"
        value={depotParams.buyOrderFeeAbsolute}
        onChange={(v) => onUpdateDepot("buyOrderFeeAbsolute", v)}
        symbol="€"
      />
      <NumInput
        label="Verkauf-Ordergebühr"
        value={depotParams.depotSellOrderFee}
        onChange={(v) => onUpdateDepot("depotSellOrderFee", v)}
        symbol="€"
      />
      <NumInput
        label="Teilfreistellung"
        value={depotParams.partialTaxExemptionRate}
        onChange={(v) => onUpdateDepot("partialTaxExemptionRate", v)}
        symbol="%"
      />
      <CheckInput
        label="Thesaurierend"
        checked={depotParams.isAccumulating}
        onChange={(v) => onUpdateDepot("isAccumulating", v)}
      />

      {/* Vorabpauschale Begleichungsart */}
      <div className="pt-2 border-t border-blue-200">
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
          Vorabsteuer-Begleichung
        </label>
        <div className="grid grid-cols-1 gap-1.5 text-xs">
          <button
            type="button"
            onClick={() =>
              onUpdateDepot("advanceTaxFundingSource", "SELL_SHARES")
            }
            className={`px-2.5 py-1.5 rounded text-left transition-colors border cursor-pointer ${
              fundingSource === "SELL_SHARES"
                ? "bg-blue-600 text-white border-blue-600 font-semibold shadow-xs"
                : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50/50"
            }`}
            title="Die Vorabpauschale wird durch Anteilsverkauf im Depot bezahlt (Budget-Gleichheit mit der Police)."
          >
            <div className="font-medium">Anteilsverkauf im Depot</div>
            <div
              className={`text-[10px] ${fundingSource === "SELL_SHARES" ? "text-blue-100" : "text-gray-500"}`}
            >
              100 % Budget-Gleichheit zur Police
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              onUpdateDepot("advanceTaxFundingSource", "EXTERNAL_CASH")
            }
            className={`px-2.5 py-1.5 rounded text-left transition-colors border cursor-pointer ${
              fundingSource === "EXTERNAL_CASH"
                ? "bg-blue-600 text-white border-blue-600 font-semibold shadow-xs"
                : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50/50"
            }`}
            title="Die Vorabpauschale wird separat vom Girokonto gezahlt (Out-of-Pocket). Erfordert zusätzlichen Cash-Einsatz."
          >
            <div className="font-medium">Zahlung vom Girokonto</div>
            <div
              className={`text-[10px] ${fundingSource === "EXTERNAL_CASH" ? "text-blue-100" : "text-gray-500"}`}
            >
              Zusätzlicher Cashflow (Out-of-Pocket)
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              onUpdateDepot(
                "advanceTaxFundingSource",
                "MATCHED_POLICE_CONTRIBUTION",
              )
            }
            className={`px-2.5 py-1.5 rounded text-left transition-colors border cursor-pointer ${
              fundingSource === "MATCHED_POLICE_CONTRIBUTION"
                ? "bg-blue-600 text-white border-blue-600 font-semibold shadow-xs"
                : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50/50"
            }`}
            title="Die Vorabsteuer im Depot wird vom Girokonto gezahlt und zeitgleich fließt eine Zuzahlung exakt gleicher Höhe in die Police (100% Budget-Gleichheit mit Steuerinvestition)."
          >
            <div className="font-medium">Zuzahlung in Police</div>
            <div
              className={`text-[10px] ${fundingSource === "MATCHED_POLICE_CONTRIBUTION" ? "text-blue-100" : "text-gray-500"}`}
            >
              1:1 Zuzahlung (Vorabsteuer-Match)
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

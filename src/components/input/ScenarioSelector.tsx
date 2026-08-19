import { useState } from "react";
import {
  PRESET_SCENARIOS,
  type ScenarioDefinition,
} from "../../constants/scenarios";
import type {
  GlobalParameters,
  TaxParameters,
  InsuranceParameters,
  WithdrawalPlanParameters,
} from "../../types/simulationParameters";

interface ScenarioSelectorProps {
  onSelectScenario: (scenario: ScenarioDefinition) => void;
  currentGlobal: GlobalParameters;
  currentTax: TaxParameters;
  currentInsurance: InsuranceParameters;
  currentPayout: WithdrawalPlanParameters;
}

export function ScenarioSelector({
  onSelectScenario,
  currentGlobal,
  currentTax,
  currentInsurance,
  currentPayout,
}: ScenarioSelectorProps) {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(
    "basis",
  );
  const [infoScenario, setInfoScenario] = useState<ScenarioDefinition | null>(
    null,
  );

  const handleSelect = (scenario: ScenarioDefinition) => {
    setSelectedScenarioId(scenario.id);
    onSelectScenario(scenario);
  };

  // Detect if current configuration matches any preset
  const isMatchingPreset = (scenario: ScenarioDefinition): boolean => {
    const g = scenario.parameters.global;
    const t = scenario.parameters.tax;
    const i = scenario.parameters.insurance;
    const p = scenario.parameters.payout;

    if (
      g?.marketReturnPa !== undefined &&
      g.marketReturnPa !== currentGlobal.marketReturnPa
    )
      return false;
    if (g?.ageStart !== undefined && g.ageStart !== currentGlobal.ageStart)
      return false;
    if (
      g?.ageRetirement !== undefined &&
      g.ageRetirement !== currentGlobal.ageRetirement
    )
      return false;
    if (
      t?.marginalTaxRateRetirement !== undefined &&
      t.marginalTaxRateRetirement !== currentTax.marginalTaxRateRetirement
    )
      return false;
    if (
      i?.halfIncomeProcedureActive !== undefined &&
      i.halfIncomeProcedureActive !== currentInsurance.halfIncomeProcedureActive
    )
      return false;
    if (
      p?.withdrawalDurationYears !== undefined &&
      p.withdrawalDurationYears !== currentPayout.withdrawalDurationYears
    )
      return false;
    return true;
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <div>
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
            Demo-Szenarien & Stresstests
          </h2>
          <p className="text-xs text-gray-500">
            Wähle ein vorkonfiguriertes Musterszenario für eine schnelle
            Gegenüberstellung
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5">
        {PRESET_SCENARIOS.map((scenario) => {
          const isSelected =
            selectedScenarioId === scenario.id && isMatchingPreset(scenario);

          return (
            <div
              key={scenario.id}
              className={`group relative flex flex-col justify-between p-3 rounded-lg border text-left transition-all cursor-pointer ${
                isSelected
                  ? "bg-blue-50/80 border-blue-500 shadow-xs ring-1 ring-blue-500"
                  : "bg-gray-50 hover:bg-gray-100/80 border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => handleSelect(scenario)}
            >
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-sm uppercase tracking-wider ${
                      scenario.id === "basis"
                        ? "bg-emerald-100 text-emerald-800"
                        : scenario.id === "steuer-arbitrage"
                          ? "bg-purple-100 text-purple-800"
                          : scenario.id === "storno-falle"
                            ? "bg-red-100 text-red-800"
                            : scenario.id === "bullenmarkt"
                              ? "bg-amber-100 text-amber-800"
                              : scenario.id === "baerenmarkt"
                                ? "bg-slate-200 text-slate-800"
                                : "bg-indigo-100 text-indigo-800"
                    }`}
                  >
                    {scenario.badge}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setInfoScenario(
                        infoScenario?.id === scenario.id ? null : scenario,
                      );
                    }}
                    className="text-gray-400 hover:text-gray-700 text-xs font-mono px-1 rounded hover:bg-gray-200 cursor-pointer"
                    title="Details & Erwartetes Ergebnis anzeigen"
                  >
                    [?]
                  </button>
                </div>
                <h3 className="text-xs font-bold text-gray-800 leading-tight mb-1">
                  {scenario.title}
                </h3>
                <p className="text-[11px] text-gray-500 line-clamp-2 leading-snug">
                  {scenario.subtitle}
                </p>
              </div>

              <div className="mt-2 pt-2 border-t border-gray-200/60 flex items-center justify-between text-[10px]">
                <span
                  className={
                    isSelected ? "font-bold text-blue-700" : "text-gray-400"
                  }
                >
                  {isSelected ? "Aktiviert" : "Laden"}
                </span>
                <span className="text-gray-400 group-hover:translate-x-0.5 transition-transform">
                  ➔
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Popover / Modal when clicked [?] */}
      {infoScenario && (
        <div className="mt-3 p-3.5 bg-gray-950 text-white rounded-lg text-xs space-y-2 border border-gray-700 animate-in fade-in duration-150">
          <div className="flex justify-between items-center border-b border-gray-800 pb-1.5">
            <span className="font-bold text-blue-400">
              {infoScenario.title}
            </span>
            <button
              type="button"
              onClick={() => setInfoScenario(null)}
              className="text-gray-400 hover:text-white text-sm px-1.5 py-0.5 rounded hover:bg-gray-800 cursor-pointer"
            >
              ✕
            </button>
          </div>
          <p className="text-gray-300 leading-relaxed">
            <strong>Beschreibung:</strong> {infoScenario.description}
          </p>
          <p className="text-emerald-300 leading-relaxed bg-emerald-950/40 p-2 rounded border border-emerald-800/40">
            <strong>Erwartetes Ergebnis:</strong> {infoScenario.expectedOutcome}
          </p>
        </div>
      )}
    </div>
  );
}

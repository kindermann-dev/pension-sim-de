import { useState } from "react";
import type {
  GlobalParameters,
  DepotParameters,
  TaxParameters,
  InsuranceParameters,
  WithdrawalPlanParameters,
} from "../../types/simulationParameters";
import { GlobalSection } from "./GlobalSection";
import { PayoutSection } from "./PayoutSection";
import { DepotSection } from "./DepotSection";
import { InsuranceSection } from "./InsuranceSection";
import { TaxSection } from "./TaxSection";

export interface ParameterFormProps {
  globalParams: GlobalParameters;
  setGlobalParams: (p: GlobalParameters) => void;
  depotParams: DepotParameters;
  setDepotParams: (p: DepotParameters) => void;
  taxParams: TaxParameters;
  setTaxParams: (p: TaxParameters) => void;
  insuranceParams: InsuranceParameters;
  setInsuranceParams: (p: InsuranceParameters) => void;
  payoutParams: WithdrawalPlanParameters;
  setPayoutParams: (p: WithdrawalPlanParameters) => void;
}

type TabType = "all" | "global" | "payout" | "depot" | "insurance" | "tax";

export function ParameterForm({
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
}: ParameterFormProps) {
  const [activeTab, setActiveTab] = useState<TabType>("all");

  const updateGlobal = (
    key: keyof GlobalParameters,
    value: number | boolean,
  ) => {
    if (globalParams[key] === value) return;
    setGlobalParams({ ...globalParams, [key]: value });
  };

  const updateDepot = (
    key: keyof DepotParameters,
    value: number | boolean | string,
  ) => {
    if (depotParams[key] === value) return;
    setDepotParams({ ...depotParams, [key]: value });
  };

  const updateTax = (key: keyof TaxParameters, value: number | boolean) => {
    if (taxParams[key] === value) return;
    setTaxParams({ ...taxParams, [key]: value });
  };

  const updateInsurance = (
    key: keyof InsuranceParameters,
    value: number | boolean,
  ) => {
    if (insuranceParams[key] === value) return;
    setInsuranceParams({ ...insuranceParams, [key]: value });
  };

  const updatePayout = (
    key: keyof WithdrawalPlanParameters,
    value: number | boolean,
  ) => {
    if (payoutParams[key] === value) return;
    setPayoutParams({ ...payoutParams, [key]: value });
  };

  const tabs: { id: TabType; label: string; badgeColor: string }[] = [
    { id: "all", label: "Alle", badgeColor: "bg-gray-100 text-gray-700" },
    {
      id: "global",
      label: "Allgemein",
      badgeColor: "bg-slate-100 text-slate-700",
    },
    {
      id: "payout",
      label: "Entnahme",
      badgeColor: "bg-amber-100 text-amber-800",
    },
    { id: "depot", label: "Depot", badgeColor: "bg-blue-100 text-blue-800" },
    {
      id: "insurance",
      label: "Police",
      badgeColor: "bg-purple-100 text-purple-800",
    },
    { id: "tax", label: "Steuern", badgeColor: "bg-red-100 text-red-800" },
  ];

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 flex flex-col h-full overflow-hidden">
      {/* Tab Navigation */}
      <div className="p-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2 px-0.5">
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-700">
            Simulationsparameter
          </h2>
          <span className="text-[10px] text-gray-400 font-medium hidden sm:inline">
            Live-Berechnung
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-2 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <div className="p-3 sm:p-3.5 overflow-y-auto space-y-3.5 max-h-[calc(100vh-14rem)] lg:max-h-[calc(100vh-9rem)]">
        {(activeTab === "all" || activeTab === "global") && (
          <GlobalSection globalParams={globalParams} onUpdate={updateGlobal} />
        )}

        {(activeTab === "all" || activeTab === "payout") && (
          <PayoutSection
            payoutParams={payoutParams}
            inflationRatePa={globalParams.inflationRatePa}
            onUpdate={updatePayout}
          />
        )}

        {(activeTab === "all" || activeTab === "depot") && (
          <DepotSection depotParams={depotParams} onUpdateDepot={updateDepot} />
        )}

        {(activeTab === "all" || activeTab === "insurance") && (
          <InsuranceSection
            insuranceParams={insuranceParams}
            insuranceWithdrawalFeeRate={payoutParams.insuranceWithdrawalFeeRate}
            onUpdateInsurance={updateInsurance}
            onUpdateWithdrawalFeeRate={(rate) =>
              updatePayout("insuranceWithdrawalFeeRate", rate)
            }
          />
        )}

        {(activeTab === "all" || activeTab === "tax") && (
          <TaxSection
            taxParams={taxParams}
            baseInterestRateAdvanceTax={globalParams.baseInterestRateAdvanceTax}
            onUpdateTax={updateTax}
            onUpdateBaseInterestRate={(rate) =>
              updateGlobal("baseInterestRateAdvanceTax", rate)
            }
          />
        )}
      </div>
    </div>
  );
}

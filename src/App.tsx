import {
  useMemo,
  lazy,
  Suspense,
  useDeferredValue,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useSimulationParameters } from "./hooks/useSimulationParameters";
import { simulateDepot } from "./logic/simulation/depot";
import { simulateInsurance } from "./logic/simulation/insurance";
import { calculateSimulationKPIs } from "./logic/math/kpiMath";
import { ParameterForm } from "./components/input/ParameterForm";
import { ScenarioSelector } from "./components/input/ScenarioSelector";
import { KpiDashboard } from "./components/output/KpiDashboard";
import { Footer } from "./components/layout/Footer";
import { LegalModal, type LegalTab } from "./components/legal/LegalModal";
import type { ScenarioDefinition } from "./constants/scenarios";
import type { CombinedDataPoint } from "./types/simulation";

const ComparisonChart = lazy(() =>
  import("./components/output/ComparisonChart").then((m) => ({
    default: m.ComparisonChart,
  })),
);
const CashflowTable = lazy(() =>
  import("./components/output/CashflowTable").then((m) => ({
    default: m.CashflowTable,
  })),
);

function App() {
  const {
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
  } = useSimulationParameters();

  const [legalModalTab, setLegalModalTab] = useState<LegalTab | null>(null);

  // Sync hash with modal state for deep linking
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === "#impressum") {
        setLegalModalTab("impressum");
      } else if (hash === "#datenschutz") {
        setLegalModalTab("datenschutz");
      } else if (!hash || hash === "#") {
        setLegalModalTab(null);
      }
    };

    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const handleOpenLegal = useCallback((tab: LegalTab) => {
    setLegalModalTab(tab);
    window.location.hash = tab;
  }, []);

  const handleCloseLegal = useCallback(() => {
    setLegalModalTab(null);
    if (
      window.location.hash === "#impressum" ||
      window.location.hash === "#datenschutz"
    ) {
      window.history.pushState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
    }
  }, []);

  const handleSelectScenario = (scenario: ScenarioDefinition) => {
    const { global, depot, insurance, tax, payout } = scenario.parameters;
    if (global) setGlobalParams((prev) => ({ ...prev, ...global }));
    if (depot) setDepotParams((prev) => ({ ...prev, ...depot }));
    if (insurance) setInsuranceParams((prev) => ({ ...prev, ...insurance }));
    if (tax) setTaxParams((prev) => ({ ...prev, ...tax }));
    if (payout) setPayoutParams((prev) => ({ ...prev, ...payout }));
  };

  const currentConfig = useMemo(
    () => ({
      global: globalParams,
      depot: depotParams,
      tax: taxParams,
      insurance: insuranceParams,
      payout: payoutParams,
    }),
    [globalParams, depotParams, taxParams, insuranceParams, payoutParams],
  );

  const deferredConfig = useDeferredValue(currentConfig);
  const isCalculating = currentConfig !== deferredConfig;

  const simulationResult = useMemo(() => {
    const { global, depot, tax, insurance, payout } = deferredConfig;

    const depotResult = simulateDepot(global, depot, tax, payout);

    let matchedSpecialContributions:
      { month: number; amount: number }[] | undefined;
    if (depot.advanceTaxFundingSource === "MATCHED_POLICE_CONTRIBUTION") {
      matchedSpecialContributions = depotResult.history
        .filter((p) => p.phase === "ACCUMULATION" && p.taxesPaid > 0)
        .map((p) => ({ month: p.month, amount: p.taxesPaid }));
    }

    const insuranceResult = simulateInsurance(
      global,
      insurance,
      tax,
      payout,
      matchedSpecialContributions,
    );
    const accumulationMonths = (global.ageRetirement - global.ageStart) * 12;

    // map combined lifecycle history
    const fullHistory: CombinedDataPoint[] = depotResult.history.map(
      (depPoint, index) => {
        const insPoint = insuranceResult.history[index];
        return {
          month: depPoint.month,
          year: depPoint.year,
          phase:
            depPoint.phase ??
            (depPoint.month <= accumulationMonths ? "ACCUMULATION" : "PAYOUT"),
          investedCapital: depPoint.investedCapital,
          depotValue: depPoint.portfolioValue,
          depotValueNet: depPoint.netPortfolioValue,
          depotTotalCashInvested:
            depPoint.investedCapital + (depPoint.cumExternalTaxPaid || 0),
          depotGrossCashflow: depPoint.grossCashflow,
          depotNetCashflow: depPoint.netCashflow,
          depotFees: depPoint.feesPaid,
          depotTaxes: depPoint.taxesPaid,
          depotTaxAllowanceUsed: depPoint.taxAllowanceUsed || 0,
          depotFeeBreakdown: depPoint.feeBreakdown,
          depotTaxBreakdown: depPoint.taxBreakdown,
          depotCumExternalTaxPaid: depPoint.cumExternalTaxPaid || 0,
          insuranceValue: insPoint?.portfolioValue || 0,
          insuranceSurrenderValue:
            insPoint?.surrenderValue || insPoint?.portfolioValue || 0,
          insuranceValueNet: insPoint?.netPortfolioValue || 0,
          insuranceGrossCashflow: insPoint?.grossCashflow || 0,
          insuranceNetCashflow: insPoint?.netCashflow || 0,
          insuranceFees: insPoint?.feesPaid || 0,
          insuranceTaxes: insPoint?.taxesPaid || 0,
          insuranceTaxAllowanceUsed: insPoint?.taxAllowanceUsed || 0,
          insuranceFeeBreakdown: insPoint?.feeBreakdown,
          insuranceTaxBreakdown: insPoint?.taxBreakdown,
        };
      },
    );

    // calculate all 5 extended financial mathematical KPIs
    const kpis = calculateSimulationKPIs(
      fullHistory,
      global,
      depot,
      insurance,
      tax,
      payout,
    );

    return { history: fullHistory, kpis };
  }, [deferredConfig]);

  const { history, kpis } = simulationResult;

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6 lg:p-8">
      <div className="max-w-[2100px] w-full mx-auto space-y-6">
        {/* Header Bar */}
        <header className="bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                ETF-Depot vs. Rentenversicherung
              </h1>
              {isCalculating ? (
                <span
                  role="status"
                  aria-live="polite"
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium text-blue-700 bg-blue-100 rounded-full animate-pulse"
                >
                  <svg
                    className="w-3.5 h-3.5 animate-spin text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  Berechnung läuft...
                </span>
              ) : (
                <span
                  role="status"
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Live berechnet
                </span>
              )}
            </div>
            <p className="text-gray-500 text-sm mt-1">
              Simulation: {globalParams.ageRetirement - globalParams.ageStart}{" "}
              Jahre Ansparphase ({globalParams.monthlySavings} €/Mtl.) &{" "}
              {payoutParams.withdrawalDurationYears} Jahre Entnahmephase (
              {payoutParams.withdrawalValue} €{" "}
              {payoutParams.withdrawalIsNet ? "Netto" : "Brutto"}/Mtl.)
            </p>
          </div>
          <button
            type="button"
            onClick={resetToDefaults}
            className="self-start sm:self-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-xs hover:bg-gray-50 hover:text-gray-900 transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            Standardwerte wiederherstellen
          </button>
        </header>

        {/* Demo Scenarios & Stress Tests */}
        <ScenarioSelector
          onSelectScenario={handleSelectScenario}
          currentGlobal={globalParams}
          currentTax={taxParams}
          currentInsurance={insuranceParams}
          currentPayout={payoutParams}
        />

        {/* Main Split-Screen Grid: Compact Parameters on the Left, Expansive KPIs & Chart on the Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Compact Sticky Parameter Sidebar */}
          <div className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-6">
            <ParameterForm
              globalParams={globalParams}
              setGlobalParams={setGlobalParams}
              depotParams={depotParams}
              setDepotParams={setDepotParams}
              taxParams={taxParams}
              setTaxParams={setTaxParams}
              insuranceParams={insuranceParams}
              setInsuranceParams={setInsuranceParams}
              payoutParams={payoutParams}
              setPayoutParams={setPayoutParams}
            />
          </div>

          {/* Right Column: Extended KPI Dashboard + Live Chart + Detailed Table */}
          <div
            className={`lg:col-span-8 xl:col-span-9 flex flex-col gap-6 min-w-0 transition-opacity duration-200 ${isCalculating ? "opacity-70" : "opacity-100"}`}
          >
            {/* Extended 5-KPI & Summary Dashboard */}
            <KpiDashboard kpis={kpis} />

            {/* Live Interactive Comparison Chart */}
            <Suspense
              fallback={
                <div className="w-full h-[480px] bg-white p-6 rounded-xl shadow-md flex items-center justify-center text-gray-500">
                  Diagramm wird geladen...
                </div>
              }
            >
              <ComparisonChart
                data={history}
                ageStart={globalParams.ageStart}
              />
            </Suspense>

            {/* Detailed Cashflow Table */}
            <Suspense
              fallback={
                <div className="w-full h-48 bg-white p-6 rounded-xl shadow-md flex items-center justify-center text-gray-500">
                  Tabelle wird geladen...
                </div>
              }
            >
              <CashflowTable data={history} />
            </Suspense>
          </div>
        </div>

        {/* Global Footer with Legal Links */}
        <Footer onOpenLegal={handleOpenLegal} />
      </div>

      {/* Impressum & Privacy Policy Modal */}
      <LegalModal
        isOpen={legalModalTab !== null}
        activeTab={legalModalTab || "impressum"}
        onClose={handleCloseLegal}
        onTabChange={handleOpenLegal}
      />
    </div>
  );
}

export default App;

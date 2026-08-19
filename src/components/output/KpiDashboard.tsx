import type { SimulationKPIs } from "../../types/simulation";

interface KpiDashboardProps {
  kpis: SimulationKPIs;
}

export function KpiDashboard({ kpis }: KpiDashboardProps) {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(val);

  const formatPercent = (val: number) =>
    new Intl.NumberFormat("de-DE", {
      style: "percent",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);

  const formatNumber = (val: number) =>
    new Intl.NumberFormat("de-DE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);

  const finalValueDiff = Math.abs(
    kpis.depotFinalValue - kpis.insuranceFinalValue,
  );
  const taxDiff = Math.abs(kpis.depotTotalTaxes - kpis.insuranceTotalTaxes);
  const feeDiff = Math.abs(kpis.depotTotalFees - kpis.insuranceTotalFees);

  return (
    <div className="space-y-4">
      {/* 3 Core Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Restkapital am Ende */}
        <div className="bg-white p-4 sm:p-5 rounded-xl shadow-md border border-gray-200 border-t-4 border-t-emerald-500 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-1.5 mb-3">
              <h3
                className="text-xs font-bold text-gray-600 uppercase tracking-wider truncate"
                title="Restkapital am Ende (Netto)"
              >
                Restkapital am Ende (Netto)
              </h3>
              {kpis.depotFinalValue !== kpis.insuranceFinalValue && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    kpis.depotFinalValue > kpis.insuranceFinalValue
                      ? "bg-blue-100 text-blue-800"
                      : "bg-purple-100 text-purple-800"
                  }`}
                >
                  {kpis.depotFinalValue > kpis.insuranceFinalValue
                    ? "Depot vorn"
                    : "Police vorn"}
                </span>
              )}
            </div>

            {/* Side-by-side metric boxes */}
            <div className="grid grid-cols-2 gap-2 mb-2.5">
              <div className="bg-blue-50/60 p-2.5 rounded-lg border border-blue-100 min-w-0">
                <span className="text-[10px] text-blue-700 font-bold uppercase tracking-wider block">
                  Depot
                </span>
                <span
                  className={`text-sm sm:text-base xl:text-lg font-bold tabular-nums block truncate ${
                    kpis.depotFinalValue > 0 ? "text-blue-900" : "text-red-600"
                  }`}
                  title={
                    kpis.depotFinalValue > 0
                      ? formatCurrency(kpis.depotFinalValue)
                      : "0 € (Aufgebraucht)"
                  }
                >
                  {kpis.depotFinalValue > 0
                    ? formatCurrency(kpis.depotFinalValue)
                    : "0 € (Leer)"}
                </span>
              </div>
              <div className="bg-purple-50/60 p-2.5 rounded-lg border border-purple-100 min-w-0 text-right">
                <span className="text-[10px] text-purple-700 font-bold uppercase tracking-wider block">
                  Police
                </span>
                <span
                  className={`text-sm sm:text-base xl:text-lg font-bold tabular-nums block truncate ${
                    kpis.insuranceFinalValue > 0
                      ? "text-purple-900"
                      : "text-red-600"
                  }`}
                  title={
                    kpis.insuranceFinalValue > 0
                      ? formatCurrency(kpis.insuranceFinalValue)
                      : "0 € (Aufgebraucht)"
                  }
                >
                  {kpis.insuranceFinalValue > 0
                    ? formatCurrency(kpis.insuranceFinalValue)
                    : "0 € (Leer)"}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Differenz:</span>
            <span className="font-semibold text-gray-800 tabular-nums">
              {formatCurrency(finalValueDiff)}
            </span>
          </div>
        </div>

        {/* Card 2: Steuerlast Gesamt */}
        <div className="bg-white p-4 sm:p-5 rounded-xl shadow-md border border-gray-200 border-t-4 border-t-red-500 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-1.5 mb-3">
              <h3
                className="text-xs font-bold text-gray-600 uppercase tracking-wider truncate"
                title="Steuerlast (Gesamter Zyklus)"
              >
                Steuerlast (Gesamt)
              </h3>
              {kpis.depotTotalTaxes !== kpis.insuranceTotalTaxes && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    kpis.depotTotalTaxes < kpis.insuranceTotalTaxes
                      ? "bg-blue-100 text-blue-800"
                      : "bg-purple-100 text-purple-800"
                  }`}
                >
                  {kpis.depotTotalTaxes < kpis.insuranceTotalTaxes
                    ? "Depot spart Steuern"
                    : "Police spart Steuern"}
                </span>
              )}
            </div>

            {/* Side-by-side metric boxes */}
            <div className="grid grid-cols-2 gap-2 mb-2.5">
              <div className="bg-red-50/50 p-2.5 rounded-lg border border-red-100 min-w-0">
                <span className="text-[10px] text-gray-600 font-bold uppercase tracking-wider block">
                  Depot
                </span>
                <span
                  className="text-sm sm:text-base xl:text-lg font-bold text-red-600 tabular-nums block truncate"
                  title={formatCurrency(kpis.depotTotalTaxes)}
                >
                  {formatCurrency(kpis.depotTotalTaxes)}
                </span>
              </div>
              <div className="bg-red-50/50 p-2.5 rounded-lg border border-red-100 min-w-0 text-right">
                <span className="text-[10px] text-gray-600 font-bold uppercase tracking-wider block">
                  Police
                </span>
                <span
                  className="text-sm sm:text-base xl:text-lg font-bold text-red-600 tabular-nums block truncate"
                  title={formatCurrency(kpis.insuranceTotalTaxes)}
                >
                  {formatCurrency(kpis.insuranceTotalTaxes)}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Steuer-Vorteil:</span>
            <span className="font-semibold text-gray-800 tabular-nums">
              {formatCurrency(taxDiff)}
            </span>
          </div>
        </div>

        {/* Card 3: Gebühren Gesamt */}
        <div className="bg-white p-4 sm:p-5 rounded-xl shadow-md border border-gray-200 border-t-4 border-t-amber-500 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-1.5 mb-3">
              <h3
                className="text-xs font-bold text-gray-600 uppercase tracking-wider truncate"
                title="Gebühren (Gesamter Zyklus)"
              >
                Gebühren (Gesamt)
              </h3>
              {kpis.depotTotalFees !== kpis.insuranceTotalFees && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    kpis.depotTotalFees < kpis.insuranceTotalFees
                      ? "bg-blue-100 text-blue-800"
                      : "bg-purple-100 text-purple-800"
                  }`}
                >
                  {kpis.depotTotalFees < kpis.insuranceTotalFees
                    ? "Depot günstiger"
                    : "Police günstiger"}
                </span>
              )}
            </div>

            {/* Side-by-side metric boxes */}
            <div className="grid grid-cols-2 gap-2 mb-2.5">
              <div className="bg-amber-50/50 p-2.5 rounded-lg border border-amber-100 min-w-0">
                <span className="text-[10px] text-gray-600 font-bold uppercase tracking-wider block">
                  Depot
                </span>
                <span
                  className="text-sm sm:text-base xl:text-lg font-bold text-amber-700 tabular-nums block truncate"
                  title={formatCurrency(kpis.depotTotalFees)}
                >
                  {formatCurrency(kpis.depotTotalFees)}
                </span>
              </div>
              <div className="bg-amber-50/50 p-2.5 rounded-lg border border-amber-100 min-w-0 text-right">
                <span className="text-[10px] text-gray-600 font-bold uppercase tracking-wider block">
                  Police
                </span>
                <span
                  className="text-sm sm:text-base xl:text-lg font-bold text-amber-700 tabular-nums block truncate"
                  title={formatCurrency(kpis.insuranceTotalFees)}
                >
                  {formatCurrency(kpis.insuranceTotalFees)}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Kosten-Vorteil:</span>
            <span className="font-semibold text-gray-800 tabular-nums">
              {formatCurrency(feeDiff)}
            </span>
          </div>
        </div>
      </div>

      {/* Extended Financial Mathematical KPIs (5 Key Metrics) */}
      <div className="bg-white p-4 sm:p-5 rounded-xl shadow-md border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-gray-200 pb-3 mb-4">
          <h2 className="text-sm sm:text-base font-bold text-gray-800">
            Erweiterte finanzmathematische Kennzahlen
          </h2>
          <span className="text-xs text-gray-500 font-medium">
            Wissenschaftlicher Rendite- &amp; Vorteilsvergleich
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
          {/* KPI 1: Netto-IRR / XIRR */}
          <div className="p-3.5 rounded-lg bg-gray-50 border border-gray-200 flex flex-col justify-between min-w-0">
            <div>
              <div className="flex items-center justify-between gap-1 mb-1">
                <span
                  className="text-xs font-bold text-gray-700 uppercase tracking-wider truncate"
                  title="Netto-IRR (XIRR)"
                >
                  Netto-IRR (XIRR)
                </span>
                <span className="group relative cursor-help text-gray-400 hover:text-gray-600 text-xs font-mono shrink-0">
                  [?]
                  <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 hidden group-hover:block w-64 p-2.5 bg-gray-950 text-white text-[11px] rounded-lg shadow-xl border border-gray-700 whitespace-normal leading-relaxed">
                    <strong>Interner Zinsfuß p.a.:</strong> Exakte Gesamtrendite
                    unter Berücksichtigung aller Einzahlungen, externer
                    Steuerabflüsse (Vorabpauschale), Netto-Auszahlungen und
                    Restwerte.
                  </span>
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mb-3 line-clamp-2">
                Reale Jahresrendite nach Kosten &amp; Steuern
              </p>
            </div>

            <div className="space-y-1.5 border-t border-gray-200 pt-2 text-xs">
              <div className="flex justify-between items-center gap-1 min-w-0">
                <span className="text-gray-600 font-medium shrink-0">
                  Depot:
                </span>
                <span
                  className={`font-bold tabular-nums truncate ${kpis.depotIrrPa >= kpis.insuranceIrrPa ? "text-blue-600" : "text-gray-700"}`}
                  title={formatPercent(kpis.depotIrrPa)}
                >
                  {formatPercent(kpis.depotIrrPa)}
                </span>
              </div>
              <div className="flex justify-between items-center gap-1 min-w-0">
                <span className="text-gray-600 font-medium shrink-0">
                  Police:
                </span>
                <span
                  className={`font-bold tabular-nums truncate ${kpis.insuranceIrrPa >= kpis.depotIrrPa ? "text-purple-600" : "text-gray-700"}`}
                  title={formatPercent(kpis.insuranceIrrPa)}
                >
                  {formatPercent(kpis.insuranceIrrPa)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-gray-200/60 text-[11px] gap-1 min-w-0">
                <span className="text-gray-400 shrink-0">Differenz:</span>
                <span
                  className={`font-semibold tabular-nums truncate ${kpis.irrDiffPa >= 0 ? "text-blue-600" : "text-purple-600"}`}
                >
                  {kpis.irrDiffPa >= 0
                    ? `+${formatNumber(kpis.irrDiffPa * 100)} %-P.`
                    : `${formatNumber(kpis.irrDiffPa * 100)} %-P.`}
                </span>
              </div>
            </div>
          </div>

          {/* KPI 2: Break-Even-Alter */}
          <div className="p-3.5 rounded-lg bg-gray-50 border border-gray-200 flex flex-col justify-between min-w-0">
            <div>
              <div className="flex items-center justify-between gap-1 mb-1">
                <span
                  className="text-xs font-bold text-gray-700 uppercase tracking-wider truncate"
                  title="Break-Even-Alter"
                >
                  Break-Even-Alter
                </span>
                <span className="group relative cursor-help text-gray-400 hover:text-gray-600 text-xs font-mono shrink-0">
                  [?]
                  <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 hidden group-hover:block w-64 p-2.5 bg-gray-950 text-white text-[11px] rounded-lg shadow-xl border border-gray-700 whitespace-normal leading-relaxed">
                    <strong>Schnittpunkt der Rentabilität:</strong> Das
                    Lebensalter, ab dem die kumulierten Netto-Auszahlungen plus
                    Restwert der Police das Depot übertreffen.
                  </span>
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mb-3 line-clamp-2">
                Wann überholt die Police das ETF-Depot?
              </p>
            </div>

            <div className="space-y-1.5 border-t border-gray-200 pt-2 text-xs">
              {kpis.breakEven.reached ? (
                <div>
                  <div className="flex items-baseline gap-1 flex-wrap">
                    <span className="text-sm sm:text-base font-bold text-purple-700 tabular-nums">
                      Alter {kpis.breakEven.ageYears}
                    </span>
                    <span className="text-[11px] text-gray-500 font-medium">
                      J. ({kpis.breakEven.ageMonths} M.)
                    </span>
                  </div>
                  <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
                    Police holt Depot auf
                  </span>
                </div>
              ) : (
                <div>
                  <p className="text-xs sm:text-sm font-bold text-blue-700">
                    Kein Schnittpunkt
                  </p>
                  <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                    Depot dauerhaft vorn
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* KPI 3: Netto-Liquiditätswert bei Rentenbeginn */}
          <div className="p-3.5 rounded-lg bg-gray-50 border border-gray-200 flex flex-col justify-between min-w-0">
            <div>
              <div className="flex items-center justify-between gap-1 mb-1">
                <span
                  className="text-xs font-bold text-gray-700 uppercase tracking-wider truncate"
                  title="Netto-Liquiditätswert"
                >
                  Netto-Liquiditätswert
                </span>
                <span className="group relative cursor-help text-gray-400 hover:text-gray-600 text-xs font-mono shrink-0">
                  [?]
                  <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 hidden group-hover:block w-64 p-2.5 bg-gray-950 text-white text-[11px] rounded-lg shadow-xl border border-gray-700 whitespace-normal leading-relaxed">
                    <strong>Sofortiger Stornowert bei Renteneintritt:</strong>{" "}
                    Auszahlung bei kompletter Portfolioauflösung nach sofortiger
                    Steuer (inkl. 12/62-Halbeinkünfteprüfung für die Police).
                  </span>
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mb-3 line-clamp-2">
                Kapital bei Komplettauflösung zu Rentenbeginn
              </p>
            </div>

            <div className="space-y-1.5 border-t border-gray-200 pt-2 text-xs">
              <div className="flex justify-between items-center gap-1 min-w-0">
                <span className="text-gray-600 font-medium shrink-0">
                  Depot:
                </span>
                <span
                  className={`font-bold tabular-nums truncate ${kpis.depotLiquidationValueAtRetirement >= kpis.insuranceLiquidationValueAtRetirement ? "text-blue-600" : "text-gray-700"}`}
                  title={formatCurrency(kpis.depotLiquidationValueAtRetirement)}
                >
                  {formatCurrency(kpis.depotLiquidationValueAtRetirement)}
                </span>
              </div>
              <div className="flex justify-between items-center gap-1 min-w-0">
                <span className="text-gray-600 font-medium shrink-0">
                  Police:
                </span>
                <span
                  className={`font-bold tabular-nums truncate ${kpis.insuranceLiquidationValueAtRetirement >= kpis.depotLiquidationValueAtRetirement ? "text-purple-600" : "text-gray-700"}`}
                  title={formatCurrency(
                    kpis.insuranceLiquidationValueAtRetirement,
                  )}
                >
                  {formatCurrency(kpis.insuranceLiquidationValueAtRetirement)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-gray-200/60 text-[11px] gap-1 min-w-0">
                <span className="text-gray-400 shrink-0">Differenz:</span>
                <span
                  className={`font-semibold tabular-nums truncate ${kpis.liquidationValueDiffAtRetirement >= 0 ? "text-blue-600" : "text-purple-600"}`}
                  title={
                    kpis.liquidationValueDiffAtRetirement >= 0
                      ? `+${formatCurrency(kpis.liquidationValueDiffAtRetirement)}`
                      : formatCurrency(kpis.liquidationValueDiffAtRetirement)
                  }
                >
                  {kpis.liquidationValueDiffAtRetirement >= 0
                    ? `+${formatCurrency(kpis.liquidationValueDiffAtRetirement)}`
                    : formatCurrency(kpis.liquidationValueDiffAtRetirement)}
                </span>
              </div>
            </div>
          </div>

          {/* KPI 4: Impliziter Rentenfaktor */}
          <div className="p-3.5 rounded-lg bg-gray-50 border border-gray-200 flex flex-col justify-between min-w-0">
            <div>
              <div className="flex items-center justify-between gap-1 mb-1">
                <span
                  className="text-xs font-bold text-gray-700 uppercase tracking-wider truncate"
                  title="Impliziter Rentenfaktor"
                >
                  Impliziter Rentenfaktor
                </span>
                <span className="group relative cursor-help text-gray-400 hover:text-gray-600 text-xs font-mono shrink-0">
                  [?]
                  <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 hidden group-hover:block w-64 p-2.5 bg-gray-950 text-white text-[11px] rounded-lg shadow-xl border border-gray-700 whitespace-normal leading-relaxed">
                    <strong>Rentenfaktor:</strong> Auszahlung in € pro Monat
                    bezogen auf 10.000 € Kapital bei Renteneintritt:
                    (Monatsrente / Rentenstartkapital) × 10.000.
                  </span>
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mb-3 line-clamp-2">
                Monatliche Rente je 10.000 € Startkapital
              </p>
            </div>

            <div className="space-y-1.5 border-t border-gray-200 pt-2 text-xs">
              <div className="flex justify-between items-center gap-1 min-w-0">
                <span className="text-gray-600 font-medium shrink-0">
                  Depot:
                </span>
                <span className="font-bold text-blue-600 tabular-nums truncate">
                  {formatNumber(kpis.depotImplicitRentenfaktor)} €
                </span>
              </div>
              <div className="flex justify-between items-center gap-1 min-w-0">
                <span className="text-gray-600 font-medium shrink-0">
                  Police:
                </span>
                <span className="font-bold text-purple-600 tabular-nums truncate">
                  {formatNumber(kpis.insuranceImplicitRentenfaktor)} €
                </span>
              </div>
              <p className="text-[10px] text-gray-400 pt-1 border-t border-gray-200/60 truncate">
                Vergleichsbasis zu Policen
              </p>
            </div>
          </div>

          {/* KPI 5: Gesamte Netto-Auszahlungssumme */}
          <div className="p-3.5 rounded-lg bg-gray-50 border border-gray-200 flex flex-col justify-between min-w-0">
            <div>
              <div className="flex items-center justify-between gap-1 mb-1">
                <span
                  className="text-xs font-bold text-gray-700 uppercase tracking-wider truncate"
                  title="Gesamte Auszahlungssumme"
                >
                  Auszahlungssumme
                </span>
                <span className="group relative cursor-help text-gray-400 hover:text-gray-600 text-xs font-mono shrink-0">
                  [?]
                  <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 hidden group-hover:block w-64 p-2.5 bg-gray-950 text-white text-[11px] rounded-lg shadow-xl border border-gray-700 whitespace-normal leading-relaxed">
                    <strong>Summe aller Netto-Auszahlungen:</strong> Der gesamte
                    reale Geldbetrag, der über die gesamte Entnahmephase auf dem
                    Bankkonto gutgeschrieben wurde.
                  </span>
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mb-3 line-clamp-2">
                Gesamte erhaltene Netto-Rente im Ruhestand
              </p>
            </div>

            <div className="space-y-1.5 border-t border-gray-200 pt-2 text-xs">
              <div className="flex justify-between items-center gap-1 min-w-0">
                <span className="text-gray-600 font-medium shrink-0">
                  Depot:
                </span>
                <span
                  className={`font-bold tabular-nums truncate ${kpis.depotTotalNetPayout >= kpis.insuranceTotalNetPayout ? "text-blue-600" : "text-gray-700"}`}
                  title={formatCurrency(kpis.depotTotalNetPayout)}
                >
                  {formatCurrency(kpis.depotTotalNetPayout)}
                </span>
              </div>
              <div className="flex justify-between items-center gap-1 min-w-0">
                <span className="text-gray-600 font-medium shrink-0">
                  Police:
                </span>
                <span
                  className={`font-bold tabular-nums truncate ${kpis.insuranceTotalNetPayout >= kpis.depotTotalNetPayout ? "text-purple-600" : "text-gray-700"}`}
                  title={formatCurrency(kpis.insuranceTotalNetPayout)}
                >
                  {formatCurrency(kpis.insuranceTotalNetPayout)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-gray-200/60 text-[11px] gap-1 min-w-0">
                <span className="text-gray-400 shrink-0">Differenz:</span>
                <span
                  className={`font-semibold tabular-nums truncate ${kpis.totalNetPayoutDiff >= 0 ? "text-blue-600" : "text-purple-600"}`}
                  title={
                    kpis.totalNetPayoutDiff >= 0
                      ? `+${formatCurrency(kpis.totalNetPayoutDiff)}`
                      : formatCurrency(kpis.totalNetPayoutDiff)
                  }
                >
                  {kpis.totalNetPayoutDiff >= 0
                    ? `+${formatCurrency(kpis.totalNetPayoutDiff)}`
                    : formatCurrency(kpis.totalNetPayoutDiff)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

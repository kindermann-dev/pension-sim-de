import { useState, useRef } from "react";
import type {
  CombinedDataPoint,
  DetailBreakdown,
} from "../../types/simulation";

interface CashflowTableProps {
  data: CombinedDataPoint[];
}

function ValueTooltip({
  children,
  breakdown,
  className = "",
}: {
  children: React.ReactNode;
  breakdown?: DetailBreakdown;
  className?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [placement, setPlacement] = useState<"top" | "bottom">("top");
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const scrollContainer = triggerRef.current.closest(".overflow-y-auto");

      if (scrollContainer) {
        const containerRect = scrollContainer.getBoundingClientRect();
        if (triggerRect.top - containerRect.top < 220) {
          setPlacement("bottom");
        } else {
          setPlacement("top");
        }
      } else {
        if (triggerRect.top < 250) {
          setPlacement("bottom");
        } else {
          setPlacement("top");
        }
      }
    }
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  if (!breakdown || breakdown.rows.length === 0) {
    return <div className={className}>{children}</div>;
  }

  const positionClass =
    placement === "bottom" ? "top-full mt-1.5" : "bottom-full mb-1.5";

  return (
    <div
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative inline-block cursor-help ${className}`}
    >
      <div className="underline decoration-dotted decoration-gray-300 hover:decoration-solid hover:decoration-blue-500 transition-all">
        {children}
      </div>
      {isVisible && (
        <div
          className={`pointer-events-none absolute ${positionClass} right-0 z-50 w-76 p-3 bg-gray-950/95 text-white text-xs rounded-xl shadow-2xl border border-gray-700/80 whitespace-normal text-left backdrop-blur-md`}
        >
          <div className="font-semibold text-gray-200 border-b border-gray-800 pb-1.5 mb-2 text-[11px] uppercase tracking-wider">
            {breakdown.title}
          </div>
          <div className="space-y-1">
            {breakdown.rows.map((row, idx) => {
              if (!row.value) {
                return (
                  <div
                    key={idx}
                    className="text-blue-300 font-semibold text-[10px] uppercase tracking-wider pt-2 pb-0.5 border-b border-gray-800 first:pt-0"
                  >
                    {row.label}
                  </div>
                );
              }
              return (
                <div
                  key={idx}
                  className={`flex justify-between items-center text-[11px] ${
                    row.isTotal
                      ? "border-t border-gray-700 pt-1.5 mt-1.5 font-bold text-white"
                      : "text-gray-300"
                  }`}
                >
                  <span
                    className={
                      row.isTotal
                        ? "font-sans font-semibold text-white"
                        : "text-gray-400 font-sans"
                    }
                  >
                    {row.label}
                  </span>
                  <span className="font-mono font-medium ml-2">
                    {row.value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function CashflowTable({ data }: CashflowTableProps) {
  const formatCur = (val: number) =>
    new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(val);

  return (
    <div className="w-full bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
      <div className="p-3.5 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h2 className="text-base font-bold text-gray-800">
          Detaillierte Cashflow-Übersicht
        </h2>
        <span className="text-[11px] text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 font-medium self-start sm:self-auto">
          💡 Hover über Werte für Berechnungs-Details
        </span>
      </div>

      <div className="overflow-x-auto max-h-160 overflow-y-auto">
        <table className="w-full text-xs text-right border-collapse whitespace-nowrap">
          <thead className="text-[11px] uppercase sticky top-0 z-10 shadow-xs">
            {/* Top Header Grouping */}
            <tr className="bg-gray-100 text-gray-700 border-b border-gray-200">
              <th
                rowSpan={2}
                className="px-2.5 py-2 text-left border-r border-gray-200 bg-gray-100 w-24"
              >
                Zeit
              </th>
              <th
                rowSpan={2}
                className="px-2.5 py-2 text-right border-r border-gray-200 bg-gray-100"
              >
                Eingezahlt
              </th>
              <th
                colSpan={4}
                className="px-2.5 py-1.5 text-center bg-blue-100 text-blue-900 border-r border-blue-200 font-bold"
              >
                ETF-Depot
              </th>
              <th
                colSpan={4}
                className="px-2.5 py-1.5 text-center bg-purple-100 text-purple-900 font-bold"
              >
                Rentenversicherung
              </th>
            </tr>
            {/* Sub-Header Columns */}
            <tr className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <th className="px-2 py-1.5 bg-blue-50/70 font-semibold">
                Brutto
              </th>
              <th className="px-2 py-1.5 bg-blue-50/70 font-semibold">Netto</th>
              <th className="px-2 py-1.5 bg-blue-50/70 font-semibold">
                Cashflow
              </th>
              <th className="px-2 py-1.5 bg-blue-50/70 font-semibold border-r border-gray-200 text-red-600">
                Geb / St
              </th>

              <th className="px-2 py-1.5 bg-purple-50/70 font-semibold">
                Brutto
              </th>
              <th className="px-2 py-1.5 bg-purple-50/70 font-semibold">
                Netto
              </th>
              <th className="px-2 py-1.5 bg-purple-50/70 font-semibold">
                Cashflow
              </th>
              <th className="px-2 py-1.5 bg-purple-50/70 font-semibold text-red-600">
                Geb / St
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => {
              const depotBankCashflow =
                row.phase === "ACCUMULATION"
                  ? row.depotGrossCashflow
                  : row.depotNetCashflow;
              const insuranceBankCashflow =
                row.phase === "ACCUMULATION"
                  ? row.insuranceGrossCashflow
                  : row.insuranceNetCashflow;

              const isYearEnd = row.month % 12 === 0;
              const isPhaseTransition =
                row.phase === "ACCUMULATION" && data[i + 1]?.phase === "PAYOUT";

              const borderClass = isPhaseTransition
                ? "border-b-4 border-amber-500"
                : isYearEnd
                  ? "border-b-2 border-slate-400"
                  : "border-b border-gray-100";

              const vorabGiro = row.depotCumExternalTaxPaid || 0;
              const totalCashInvestedDepot = row.investedCapital + vorabGiro;
              const latentDepotTax = Math.max(
                0,
                row.depotValue - row.depotValueNet,
              );
              const depotNetProfit = row.depotValueNet - totalCashInvestedDepot;

              const insuranceGross = row.insuranceValue;
              const insuranceSurrender =
                row.insuranceSurrenderValue ?? row.insuranceValue;
              const hasZillmerDeduction =
                insuranceSurrender < insuranceGross - 0.01;

              // Breakdowns for Tooltips
              const investedBreakdown: DetailBreakdown = {
                title: "Eingezahltes Kapital",
                rows: [
                  {
                    label: "Eingezahlte Sparraten (Basis)",
                    value: formatCur(row.investedCapital),
                  },
                  {
                    label: "→ In Police geflossen",
                    value: formatCur(row.investedCapital),
                  },
                  ...(vorabGiro > 0
                    ? [
                        {
                          label: "+ Vorabpauschale (nur Depot Giro)",
                          value: `+ ${formatCur(vorabGiro)}`,
                        },
                        {
                          label: "→ Gesamter Depot-Cash-Einsatz",
                          value: formatCur(totalCashInvestedDepot),
                          isTotal: true,
                        },
                      ]
                    : [
                        {
                          label: "Status",
                          value:
                            "100 % identischer Cash-Einsatz für Depot & Police",
                        },
                      ]),
                ],
              };

              const depotGrossBreakdown: DetailBreakdown = {
                title: "Depot-Marktwert (Brutto)",
                rows: [
                  {
                    label: "Status",
                    value: "Unberührter Depotwert zu Marktpreisen",
                  },
                  {
                    label: "Gesamter Marktwert",
                    value: formatCur(row.depotValue),
                    isTotal: true,
                  },
                ],
              };

              const depotNetBreakdown: DetailBreakdown = {
                title: "Netto-Liquidationswert (Depot)",
                rows: [
                  {
                    label: "Depot-Marktwert (Brutto)",
                    value: formatCur(row.depotValue),
                  },
                  {
                    label:
                      latentDepotTax > 0
                        ? "- Fiktive Steuer bei Verkauf"
                        : "Fiktive Steuer",
                    value:
                      latentDepotTax > 0
                        ? `- ${formatCur(latentDepotTax)}`
                        : "0,00 € (FSA)",
                  },
                  {
                    label: "= Netto-Auszahlungswert",
                    value: formatCur(row.depotValueNet),
                    isTotal: true,
                  },
                  {
                    label: "Echter Netto-Gewinn",
                    value: `${depotNetProfit >= 0 ? "+" : ""}${formatCur(depotNetProfit)}`,
                  },
                ],
              };

              const insuranceGrossBreakdown: DetailBreakdown = {
                title: "Policen-Fondsguthaben (Brutto)",
                rows: [
                  {
                    label: "Status",
                    value: "Fondsvermögen im Versicherungsmantel",
                  },
                  {
                    label: "Fondsguthaben (Brutto)",
                    value: formatCur(insuranceGross),
                    isTotal: true,
                  },
                  ...(hasZillmerDeduction
                    ? [
                        {
                          label: "- Unamortisierte Zillmerkosten",
                          value: `- ${formatCur(insuranceGross - insuranceSurrender)}`,
                        },
                        {
                          label: "= Rückkaufswert vor Steuern",
                          value: formatCur(insuranceSurrender),
                          isTotal: true,
                        },
                      ]
                    : []),
                ],
              };

              const insuranceNetBreakdown: DetailBreakdown = {
                title: "Netto-Liquidationswert (Police)",
                rows: [
                  {
                    label: "Eingezahlt in Police",
                    value: formatCur(row.investedCapital),
                  },
                  {
                    label: "Rückkaufswert vor Steuern",
                    value: formatCur(insuranceSurrender),
                  },
                  {
                    label: "Latente Steuer bei Kündigung",
                    value: `- ${formatCur(Math.max(0, insuranceSurrender - row.insuranceValueNet))}`,
                  },
                  {
                    label: "= Netto-Auszahlungswert",
                    value: formatCur(row.insuranceValueNet),
                    isTotal: true,
                  },
                ],
              };

              return (
                <tr
                  key={i}
                  className={`${borderClass} hover:bg-gray-50/80 transition-colors ${
                    row.phase === "PAYOUT" ? "bg-yellow-50/20" : ""
                  }`}
                >
                  {/* Zeit */}
                  <td className="px-2.5 py-1.5 text-left border-r border-gray-200 font-mono text-gray-600">
                    <span className="font-semibold text-gray-800">
                      M{row.month}
                    </span>{" "}
                    <span className="text-[10px] text-gray-400">
                      J{row.year}
                    </span>
                    <span
                      className={`ml-1.5 text-[9px] font-bold px-1 py-0.2 rounded ${
                        row.phase === "ACCUMULATION"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {row.phase === "ACCUMULATION" ? "ANSPAREN" : "ENTNAHME"}
                    </span>
                  </td>

                  {/* Eingezahlt */}
                  <td className="px-2.5 py-1.5 text-right border-r border-gray-200 font-medium text-gray-700 bg-gray-50/50">
                    <ValueTooltip breakdown={investedBreakdown}>
                      <span className="font-mono">
                        {formatCur(row.investedCapital)}
                      </span>
                      {vorabGiro > 0 && (
                        <div className="text-[9px] text-blue-600 font-normal leading-tight">
                          +{formatCur(vorabGiro)} Depot-St.
                        </div>
                      )}
                    </ValueTooltip>
                  </td>

                  {/* Depot Brutto */}
                  <td className="px-2 py-1.5 bg-blue-50/10 text-gray-600">
                    <ValueTooltip breakdown={depotGrossBreakdown}>
                      <span className="font-mono">
                        {formatCur(row.depotValue)}
                      </span>
                    </ValueTooltip>
                  </td>

                  {/* Depot Netto */}
                  <td className="px-2 py-1.5 font-semibold text-blue-700 bg-blue-50/10">
                    <ValueTooltip breakdown={depotNetBreakdown}>
                      <span className="font-mono">
                        {formatCur(row.depotValueNet)}
                      </span>
                    </ValueTooltip>
                  </td>

                  {/* Depot Cashflow */}
                  <td className="px-2 py-1.5 bg-blue-50/10 font-medium text-gray-800">
                    <span className="font-mono">
                      {formatCur(depotBankCashflow)}
                    </span>
                    {row.phase === "PAYOUT" &&
                      Math.abs(row.depotGrossCashflow - row.depotNetCashflow) >
                        0.01 && (
                        <div className="text-[9px] text-gray-400 font-normal leading-tight">
                          Brutto {formatCur(row.depotGrossCashflow)}
                        </div>
                      )}
                  </td>

                  {/* Depot Geb / St */}
                  <td className="px-2 py-1.5 border-r border-gray-200 bg-blue-50/10 text-[11px] leading-tight">
                    <ValueTooltip
                      breakdown={row.depotFeeBreakdown}
                      className="inline"
                    >
                      <span
                        className={
                          row.depotFees > 0
                            ? "text-orange-600 font-medium"
                            : "text-gray-400"
                        }
                      >
                        Geb: {formatCur(row.depotFees)}
                      </span>
                    </ValueTooltip>
                    {" · "}
                    <ValueTooltip
                      breakdown={row.depotTaxBreakdown}
                      className="inline"
                    >
                      <span
                        className={
                          row.depotTaxes > 0
                            ? "text-red-600 font-medium"
                            : "text-gray-400"
                        }
                      >
                        St: {formatCur(row.depotTaxes)}
                      </span>
                    </ValueTooltip>
                    {row.depotTaxAllowanceUsed > 0 && (
                      <div className="text-[9px] text-emerald-600 font-semibold leading-tight">
                        FSA: {formatCur(row.depotTaxAllowanceUsed)}
                      </div>
                    )}
                  </td>

                  {/* Police Brutto */}
                  <td className="px-2 py-1.5 bg-purple-50/10 text-gray-600">
                    <ValueTooltip breakdown={insuranceGrossBreakdown}>
                      <span className="font-mono">
                        {formatCur(row.insuranceValue)}
                      </span>
                    </ValueTooltip>
                  </td>

                  {/* Police Netto */}
                  <td className="px-2 py-1.5 font-semibold text-purple-700 bg-purple-50/10">
                    <ValueTooltip breakdown={insuranceNetBreakdown}>
                      <span className="font-mono">
                        {formatCur(row.insuranceValueNet)}
                      </span>
                    </ValueTooltip>
                  </td>

                  {/* Police Cashflow */}
                  <td className="px-2 py-1.5 bg-purple-50/10 font-medium text-gray-800">
                    <span className="font-mono">
                      {formatCur(insuranceBankCashflow)}
                    </span>
                    {row.phase === "PAYOUT" &&
                      Math.abs(
                        row.insuranceGrossCashflow - row.insuranceNetCashflow,
                      ) > 0.01 && (
                        <div className="text-[9px] text-gray-400 font-normal leading-tight">
                          Brutto {formatCur(row.insuranceGrossCashflow)}
                        </div>
                      )}
                  </td>

                  {/* Police Geb / St */}
                  <td className="px-2 py-1.5 bg-purple-50/10 text-[11px] leading-tight">
                    <ValueTooltip
                      breakdown={row.insuranceFeeBreakdown}
                      className="inline"
                    >
                      <span
                        className={
                          row.insuranceFees > 0
                            ? "text-orange-600 font-medium"
                            : "text-gray-400"
                        }
                      >
                        Geb: {formatCur(row.insuranceFees)}
                      </span>
                    </ValueTooltip>
                    {" · "}
                    <ValueTooltip
                      breakdown={row.insuranceTaxBreakdown}
                      className="inline"
                    >
                      <span
                        className={
                          row.insuranceTaxes > 0
                            ? "text-red-600 font-medium"
                            : "text-gray-400"
                        }
                      >
                        St: {formatCur(row.insuranceTaxes)}
                      </span>
                    </ValueTooltip>
                    {row.insuranceTaxAllowanceUsed > 0 && (
                      <div className="text-[9px] text-emerald-600 font-semibold leading-tight">
                        FSA: {formatCur(row.insuranceTaxAllowanceUsed)}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

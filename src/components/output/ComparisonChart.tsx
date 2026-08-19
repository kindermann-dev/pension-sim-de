import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
  ReferenceLine,
} from "recharts";
import type { CombinedDataPoint } from "../../types/simulation";

interface ComparisonChartProps {
  data: CombinedDataPoint[];
  ageStart?: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: readonly {
    payload: CombinedDataPoint;
    dataKey: string;
    name: string;
    value: number;
    color: string;
  }[];
  label?: string | number;
  ageStart?: number;
}

function CustomChartTooltip({
  active,
  payload,
  ageStart = 30,
}: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);

  const currentAge = Math.floor(ageStart + (point.month - 1) / 12);
  const contractYears = (point.month - 1) / 12;
  const isQualified1262 = contractYears >= 12 && currentAge >= 62;

  // Depot values
  const depotGross = point.depotValue;
  const depotNet = point.depotValueNet;
  const latentDepotTax = Math.max(0, depotGross - depotNet);
  const spareraten = point.investedCapital;
  const vorabGiro = point.depotCumExternalTaxPaid || 0;
  const totalCash = point.depotTotalCashInvested ?? spareraten + vorabGiro;
  const depotNetGain = depotNet - totalCash;

  // Insurance values
  const insuranceGross = point.insuranceValue;
  const insuranceSurrender =
    point.insuranceSurrenderValue ?? point.insuranceValue;
  const insuranceNet = point.insuranceValueNet;
  const hasZillmerDeduction = insuranceSurrender < insuranceGross - 0.01;
  const zillmerDeduction = Math.max(0, insuranceGross - insuranceSurrender);
  const latentInsTax = Math.max(0, insuranceSurrender - insuranceNet);
  const insuranceNetGain = insuranceNet - spareraten;

  return (
    <div className="bg-gray-950/95 text-white p-3.5 rounded-xl shadow-2xl border border-gray-700/80 text-xs w-84 font-sans backdrop-blur-md">
      <div className="flex justify-between items-center pb-2 mb-2 border-b border-gray-800 font-semibold text-gray-200">
        <span className="text-[13px] text-white">
          Jahr {point.year} (Alter {currentAge})
        </span>
        <span className="text-[10px] text-gray-400 font-mono">
          Monat {point.month}
        </span>
      </div>

      {/* Depot Valuation Breakdown */}
      <div className="space-y-1 text-[11px]">
        <div className="font-semibold text-blue-300 text-[10px] uppercase tracking-wider">
          ETF-Depot
        </div>
        <div className="flex justify-between text-blue-200">
          <span className="text-gray-400">Marktwert (Brutto):</span>
          <span className="font-mono font-medium">
            {formatCurrency(depotGross)}
          </span>
        </div>
        {latentDepotTax > 0.01 ? (
          <div className="flex justify-between text-red-300">
            <span className="text-gray-400">
              - Fiktive Steuer bei Verkauf (FIFO):
            </span>
            <span className="font-mono font-medium">
              - {formatCurrency(latentDepotTax)}
            </span>
          </div>
        ) : (
          <div className="flex justify-between text-emerald-400/80 text-[10px]">
            <span className="text-gray-400">- Fiktive Steuer bei Verkauf:</span>
            <span className="font-mono">0 € (durch FSA gedeckt)</span>
          </div>
        )}
        <div className="flex justify-between text-blue-400 font-semibold border-t border-gray-800/80 pt-1">
          <span>= Netto-Liquidationswert:</span>
          <span className="font-mono">{formatCurrency(depotNet)}</span>
        </div>
      </div>

      <div className="my-2 border-t border-gray-800/80" />

      {/* Insurance Valuation Breakdown */}
      <div className="space-y-1 text-[11px]">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-purple-300 text-[10px] uppercase tracking-wider">
            Rentenversicherung
          </span>
          {isQualified1262 && (
            <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60">
              12/62 Halbeinkünfte
            </span>
          )}
        </div>
        <div className="flex justify-between text-purple-200">
          <span className="text-gray-400">Fondsguthaben (Brutto):</span>
          <span className="font-mono font-medium">
            {formatCurrency(insuranceGross)}
          </span>
        </div>
        {hasZillmerDeduction && (
          <div className="flex justify-between text-amber-300">
            <span className="text-gray-400">
              - Unamortisierte Zillmerkosten:
            </span>
            <span className="font-mono font-medium">
              - {formatCurrency(zillmerDeduction)}
            </span>
          </div>
        )}
        {hasZillmerDeduction && (
          <div className="flex justify-between text-purple-300/90 text-[10px]">
            <span className="text-gray-400">→ Rückkaufswert vor Steuern:</span>
            <span className="font-mono">
              {formatCurrency(insuranceSurrender)}
            </span>
          </div>
        )}
        {latentInsTax > 0.01 ? (
          <div className="flex justify-between text-red-300">
            <span className="text-gray-400">- Steuer bei Kündigung:</span>
            <span className="font-mono font-medium">
              - {formatCurrency(latentInsTax)}
            </span>
          </div>
        ) : (
          <div className="flex justify-between text-emerald-400/80 text-[10px]">
            <span className="text-gray-400">- Steuer bei Kündigung:</span>
            <span className="font-mono">0 € (kein Gewinn / FSA)</span>
          </div>
        )}
        <div className="flex justify-between text-purple-400 font-semibold border-t border-gray-800/80 pt-1">
          <span>= Netto-Liquidationswert:</span>
          <span className="font-mono">{formatCurrency(insuranceNet)}</span>
        </div>
      </div>

      <div className="my-2 border-t border-gray-800/80" />

      {/* Cash Invested Breakdown */}
      <div className="space-y-1 text-[11px]">
        <div className="flex justify-between text-gray-300">
          <span className="text-gray-400">Eingezahlte Sparraten (Basis):</span>
          <span className="font-mono">{formatCurrency(spareraten)}</span>
        </div>
        {vorabGiro > 0.01 && (
          <div className="flex justify-between text-blue-300">
            <span className="text-gray-400">
              + Vorabpauschale (nur Depot Giro):
            </span>
            <span className="font-mono font-medium">
              + {formatCurrency(vorabGiro)}
            </span>
          </div>
        )}
      </div>

      <div className="my-2 border-t border-gray-800/80" />

      {/* True Net Profit comparison */}
      <div className="space-y-1 text-[11px]">
        <div className="flex justify-between">
          <span className="text-blue-300">Echter Depot Netto-Gewinn:</span>
          <span
            className={`font-mono font-medium ${depotNetGain >= 0 ? "text-emerald-400" : "text-rose-400"}`}
          >
            {depotNetGain >= 0 ? "+" : ""}
            {formatCurrency(depotNetGain)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-purple-300">Echter Police Netto-Gewinn:</span>
          <span
            className={`font-mono font-medium ${insuranceNetGain >= 0 ? "text-emerald-400" : "text-rose-400"}`}
          >
            {insuranceNetGain >= 0 ? "+" : ""}
            {formatCurrency(insuranceNetGain)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function ComparisonChart({ data, ageStart = 30 }: ComparisonChartProps) {
  const payoutStartPoint = data.find((point) => point.phase === "PAYOUT");
  const retirementMonth = payoutStartPoint ? payoutStartPoint.month : null;

  return (
    <div className="w-full h-[480px] lg:h-[540px] bg-white p-5 md:p-6 rounded-xl shadow-md border border-gray-200">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold text-gray-800">
          Lebenszyklus-Performance
        </h2>
        <span className="text-xs text-gray-400 font-medium">
          Vermögensverlauf & Liquiditätsvergleich
        </span>
      </div>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#e5e7eb"
          />

          <XAxis
            dataKey="month"
            tickFormatter={(tick: number | string) => `M ${tick}`}
            stroke="#6b7280"
            minTickGap={50}
          />

          <YAxis
            tickFormatter={(tick: number | string) =>
              `${(Number(tick) / 1000).toFixed(0)}k €`
            }
            stroke="#6b7280"
            width={80}
          />

          <Tooltip content={<CustomChartTooltip ageStart={ageStart} />} />

          <Legend wrapperStyle={{ paddingTop: "20px" }} />

          {retirementMonth && (
            <ReferenceLine
              x={retirementMonth}
              stroke="#ef4444"
              strokeDasharray="5 5"
              label={{
                position: "top",
                value: "Start der Entnahme",
                fill: "#ef4444",
                fontSize: 14,
                fontWeight: "bold",
              }}
            />
          )}

          {/* 1. Gesamter Cash-Einsatz: Dunkelgraue Referenzlinie am Boden */}
          <Line
            type="monotone"
            dataKey="depotTotalCashInvested"
            name="Gesamter Cash-Einsatz"
            stroke="#475569"
            strokeWidth={2}
            strokeDasharray="3 3"
            dot={false}
          />

          {/* 2. Depot Bruttowert: Helle, gestrichelte blaue Linie */}
          <Line
            type="monotone"
            dataKey="depotValue"
            name="Depot (Brutto)"
            stroke="#93c5fd"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
          />

          {/* 3. Depot Netto-Liquidationswert: Kräftige, durchgezogene blaue Primärlinie */}
          <Line
            type="monotone"
            dataKey="depotValueNet"
            name="Depot (Netto)"
            stroke="#2563eb"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 7 }}
          />

          {/* 4. Police Bruttowert / Fondsguthaben: Helle, gestrichelte lila Linie */}
          <Line
            type="monotone"
            dataKey="insuranceValue"
            name="Police (Brutto)"
            stroke="#d8b4fe"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
          />

          {/* 5. Police Netto-Liquidationswert: Kräftige, durchgezogene lila Primärlinie */}
          <Line
            type="monotone"
            dataKey="insuranceValueNet"
            name="Police (Netto)"
            stroke="#9333ea"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

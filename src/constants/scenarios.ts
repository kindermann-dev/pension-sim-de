import type {
  GlobalParameters,
  DepotParameters,
  TaxParameters,
  InsuranceParameters,
  WithdrawalPlanParameters,
} from "../types/simulationParameters";
import {
  INITIAL_GLOBAL_PARAMETERS,
  INITIAL_DEPOT_PARAMETERS,
  INITIAL_TAX_PARAMETERS,
  INITIAL_INSURANCE_PARAMETERS,
  INITIAL_PAYOUT_PARAMETERS,
} from "../hooks/useSimulationParameters";

export interface ScenarioDefinition {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  expectedOutcome: string;
  parameters: {
    global?: Partial<GlobalParameters>;
    depot?: Partial<DepotParameters>;
    insurance?: Partial<InsuranceParameters>;
    tax?: Partial<TaxParameters>;
    payout?: Partial<WithdrawalPlanParameters>;
  };
}

export const PRESET_SCENARIOS: ScenarioDefinition[] = [
  {
    id: "basis",
    badge: "Standard",
    title: "1. Basis-Szenario (Durchschnittssparer)",
    subtitle: "Reguläre Marktbedingungen & moderate Besteuerung",
    description:
      "Prüft das Standardverhalten unter regulären Marktbedingungen ohne extreme Ausreißer.",
    expectedOutcome:
      "Das Depot hat ein höheres Restkapital bei Renteneintritt. Die Police liefert tendenziell steuerbegünstigte Auszahlungen. Der Break-Even-Point liegt meist zwischen dem 80. und 85. Lebensjahr.",
    parameters: {
      global: {
        ...INITIAL_GLOBAL_PARAMETERS,
        ageStart: 32,
        ageRetirement: 67,
        marketReturnPa: 7.0,
        baseInterestRateAdvanceTax: 2.5,
        monthlySavings: 250,
      },
      depot: {
        ...INITIAL_DEPOT_PARAMETERS,
      },
      tax: {
        ...INITIAL_TAX_PARAMETERS,
        marginalTaxRateRetirement: 25.0,
        enableAdvanceTax: true,
      },
      insurance: {
        ...INITIAL_INSURANCE_PARAMETERS,
        halfIncomeProcedureActive: true,
      },
      payout: {
        ...INITIAL_PAYOUT_PARAMETERS,
        withdrawalValue: 2000,
        withdrawalDurationYears: 25,
        withdrawalIsNet: true,
      },
    },
  },
  {
    id: "steuer-arbitrage",
    badge: "Steuervorteil",
    title: "2. Steuer-Arbitrage (Hohe Altersbezüge)",
    subtitle: "Spitzensteuersatz mit Halbeinkünfte-Hebel",
    description:
      "Isoliert die Hebelwirkung des Versicherungsmantels in der Entnahmephase (Halbeinkünfteverfahren bei hohem Grenzsteuersatz).",
    expectedOutcome:
      "Die Police gewinnt den Vergleich deutlich. Die Steuerersparnis in der Auszahlungsphase überkompensiert die Alpha-, Beta- und Gamma-Kosten der Ansparphase.",
    parameters: {
      global: {
        ...INITIAL_GLOBAL_PARAMETERS,
        ageStart: 30,
        ageRetirement: 67,
        marketReturnPa: 7.0,
        monthlySavings: 400,
      },
      depot: {
        ...INITIAL_DEPOT_PARAMETERS,
      },
      tax: {
        ...INITIAL_TAX_PARAMETERS,
        marginalTaxRateRetirement: 42.0,
      },
      insurance: {
        ...INITIAL_INSURANCE_PARAMETERS,
        halfIncomeProcedureActive: true,
      },
      payout: {
        ...INITIAL_PAYOUT_PARAMETERS,
        withdrawalValue: 2500,
        withdrawalDurationYears: 25,
        withdrawalIsNet: true,
      },
    },
  },
  {
    id: "storno-falle",
    badge: "Kostenfalle",
    title: "3. Kurzläufer / Storno-Falle",
    subtitle: "Zillmerung bei 10 Jahren Laufzeit ohne Steuerprivileg",
    description:
      "Prüft die Auswirkungen der Zillmerung (vorgezogene Abschlusskosten in den ersten 5 Jahren) bei kurzer Haltedauer.",
    expectedOutcome:
      "Das Depot gewinnt massiv. Die Police erwirtschaftet in den ersten Jahren kaum Zinseszins, da die Beiträge zur Tilgung der Zillmerkosten genutzt werden. Zudem entfällt das 12/62-Steuerprivileg.",
    parameters: {
      global: {
        ...INITIAL_GLOBAL_PARAMETERS,
        ageStart: 30,
        ageRetirement: 40,
        marketReturnPa: 7.0,
        monthlySavings: 300,
      },
      depot: {
        ...INITIAL_DEPOT_PARAMETERS,
      },
      tax: {
        ...INITIAL_TAX_PARAMETERS,
        marginalTaxRateRetirement: 30.0,
      },
      insurance: {
        ...INITIAL_INSURANCE_PARAMETERS,
        halfIncomeProcedureActive: false,
      },
      payout: {
        ...INITIAL_PAYOUT_PARAMETERS,
        withdrawalValue: 1200,
        withdrawalDurationYears: 15,
        withdrawalIsNet: true,
      },
    },
  },
  {
    id: "bullenmarkt",
    badge: "Steuerstundung",
    title: "4. Bullenmarkt & Vorabpauschale",
    subtitle: "Hohe Rendite & Vorabsteuer-Liquiditätsabfluss",
    description:
      "Prüft die Auswirkungen der Steuerstundung der Police vs. unterjährigem Liquiditätsabfluss im Depot bei hoher Marktrendite.",
    expectedOutcome:
      "Im Depot fließt jährlich signifikant Liquidität für die Vorabpauschale ab, was den Zinseszins bremst. Die Police stundet die Steuern komplett bis zur Rente, was den Zinseszinseffekt maximiert.",
    parameters: {
      global: {
        ...INITIAL_GLOBAL_PARAMETERS,
        ageStart: 30,
        ageRetirement: 67,
        marketReturnPa: 10.0,
        baseInterestRateAdvanceTax: 4.0,
        initialCapital: 50000,
        monthlySavings: 500,
      },
      depot: {
        ...INITIAL_DEPOT_PARAMETERS,
      },
      tax: {
        ...INITIAL_TAX_PARAMETERS,
        enableAdvanceTax: true,
      },
      insurance: {
        ...INITIAL_INSURANCE_PARAMETERS,
        halfIncomeProcedureActive: true,
      },
      payout: {
        ...INITIAL_PAYOUT_PARAMETERS,
        withdrawalValue: 4000,
        withdrawalDurationYears: 25,
        withdrawalIsNet: true,
      },
    },
  },
  {
    id: "baerenmarkt",
    badge: "Niedrigzins",
    title: "5. Niedrigzins-Phase (Bärenmarkt)",
    subtitle: "Schwache Rendite & laufende Versicherungskosten",
    description:
      "Prüft die Fixkosten-Belastung bei schwacher Marktrendite von nur 3,0 % p.a.",
    expectedOutcome:
      "Das Depot gewinnt. Die Police leidet unter den prozentualen Verwaltungskosten, die den geringen Zinseszins nahezu eliminieren. Im Depot fällt die Vorabpauschale mangels Basisertrag aus.",
    parameters: {
      global: {
        ...INITIAL_GLOBAL_PARAMETERS,
        ageStart: 30,
        ageRetirement: 67,
        marketReturnPa: 3.0,
        baseInterestRateAdvanceTax: 0.0,
        inflationRatePa: 2.5,
        monthlySavings: 250,
      },
      depot: {
        ...INITIAL_DEPOT_PARAMETERS,
      },
      tax: {
        ...INITIAL_TAX_PARAMETERS,
        enableAdvanceTax: true,
      },
      insurance: {
        ...INITIAL_INSURANCE_PARAMETERS,
        halfIncomeProcedureActive: true,
      },
      payout: {
        ...INITIAL_PAYOUT_PARAMETERS,
        withdrawalValue: 1200,
        withdrawalDurationYears: 20,
        withdrawalIsNet: true,
      },
    },
  },
  {
    id: "langlebigkeit",
    badge: "Stresstest",
    title: "6. Langlebigkeits-Stresstest",
    subtitle: "35 Jahre Entnahmephase (Alter 67 bis 102)",
    description:
      "Prüft den langfristigen Kapitalverzehr über eine extrem lange Rentenphase von 35 Jahren.",
    expectedOutcome:
      "Zeigt exakt das Alter, ab dem das Depot-Restkapital auf 0,00 € fällt, während die Police das Vermögen dank günstiger Auszahlungsbesteuerung länger streckt.",
    parameters: {
      global: {
        ...INITIAL_GLOBAL_PARAMETERS,
        ageStart: 30,
        ageRetirement: 67,
        monthlySavings: 350,
        marketReturnPa: 6.5,
      },
      depot: {
        ...INITIAL_DEPOT_PARAMETERS,
      },
      tax: {
        ...INITIAL_TAX_PARAMETERS,
        marginalTaxRateRetirement: 30.0,
      },
      insurance: {
        ...INITIAL_INSURANCE_PARAMETERS,
        halfIncomeProcedureActive: true,
      },
      payout: {
        ...INITIAL_PAYOUT_PARAMETERS,
        withdrawalValue: 2800,
        withdrawalDurationYears: 35,
        withdrawalIsNet: true,
      },
    },
  },
];

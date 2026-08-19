import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { KpiDashboard } from "../KpiDashboard";
import type { SimulationKPIs } from "../../../types/simulation";

describe("KpiDashboard Component", () => {
  const mockKPIs: SimulationKPIs = {
    depotIrrPa: 0.0625,
    insuranceIrrPa: 0.054,
    irrDiffPa: 0.0085,
    breakEven: {
      reached: true,
      ageYears: 78,
      ageMonths: 4,
      month: 580,
      description: "Erreicht mit Alter 78 Jahren und 4 Monaten (Monat 580)",
    },
    depotLiquidationValueAtRetirement: 450000,
    insuranceLiquidationValueAtRetirement: 420000,
    liquidationValueDiffAtRetirement: 30000,
    depotImplicitRentenfaktor: 44.44,
    insuranceImplicitRentenfaktor: 47.62,
    depotTotalNetPayout: 600000,
    insuranceTotalNetPayout: 600000,
    totalNetPayoutDiff: 0,
    depotFinalValue: 120000,
    insuranceFinalValue: 80000,
    depotTotalTaxes: 45000,
    insuranceTotalTaxes: 32000,
    depotTotalFees: 1200,
    insuranceTotalFees: 28000,
  };

  it("renders all 5 financial mathematical KPIs with accurate labels", () => {
    render(<KpiDashboard kpis={mockKPIs} />);

    // Check KPI Titles
    expect(screen.getByText("Netto-IRR (XIRR)")).toBeDefined();
    expect(screen.getByText("Break-Even-Alter")).toBeDefined();
    expect(screen.getByText("Netto-Liquiditätswert")).toBeDefined();
    expect(screen.getByText("Impliziter Rentenfaktor")).toBeDefined();
    expect(screen.getByText("Auszahlungssumme")).toBeDefined();

    // Check rendered values
    expect(screen.getByText("6,25 %")).toBeDefined();
    expect(screen.getByText("5,40 %")).toBeDefined();
    expect(screen.getByText("Alter 78")).toBeDefined();
    expect(screen.getByText("J. (4 M.)")).toBeDefined();
    expect(screen.getByText("44,44 €")).toBeDefined();
    expect(screen.getByText("47,62 €")).toBeDefined();
  });

  it("renders unreached break-even state cleanly", () => {
    const unreachedKPIs: SimulationKPIs = {
      ...mockKPIs,
      breakEven: {
        reached: false,
        ageYears: null,
        ageMonths: null,
        month: null,
        description: "Depot bleibt dauerhaft vorn",
      },
    };

    render(<KpiDashboard kpis={unreachedKPIs} />);
    expect(screen.getByText("Kein Schnittpunkt")).toBeDefined();
    expect(screen.getByText("Depot dauerhaft vorn")).toBeDefined();
  });
});

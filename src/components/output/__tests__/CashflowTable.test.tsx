import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CashflowTable } from "../CashflowTable";
import type { CombinedDataPoint } from "../../../types/simulation";

describe("CashflowTable Component", () => {
  const mockData: CombinedDataPoint[] = [
    {
      month: 1,
      year: 1,
      phase: "ACCUMULATION",
      investedCapital: 200,
      depotValue: 200,
      depotValueNet: 200,
      depotTotalCashInvested: 200,
      depotGrossCashflow: 200,
      depotNetCashflow: 198,
      depotFees: 2,
      depotTaxes: 0,
      depotTaxAllowanceUsed: 0,
      depotCumExternalTaxPaid: 0,
      insuranceValue: 190,
      insuranceValueNet: 190,
      insuranceGrossCashflow: 200,
      insuranceNetCashflow: 190,
      insuranceFees: 10,
      insuranceTaxes: 0,
      insuranceTaxAllowanceUsed: 0,
    },
    {
      month: 13,
      year: 2,
      phase: "ACCUMULATION",
      investedCapital: 2600,
      depotValue: 2800,
      depotValueNet: 2780,
      depotTotalCashInvested: 2650,
      depotGrossCashflow: 200,
      depotNetCashflow: 198,
      depotFees: 2,
      depotTaxes: 50,
      depotTaxAllowanceUsed: 100,
      depotCumExternalTaxPaid: 50,
      insuranceValue: 2500,
      insuranceValueNet: 2500,
      insuranceGrossCashflow: 200,
      insuranceNetCashflow: 190,
      insuranceFees: 10,
      insuranceTaxes: 0,
      insuranceTaxAllowanceUsed: 0,
    },
  ];

  it("renders table headers with clean column labels", () => {
    render(<CashflowTable data={mockData} />);

    expect(screen.getByText("Eingezahlt")).toBeDefined();
    expect(screen.getAllByText("Brutto").length).toBe(2);
    expect(screen.getAllByText("Netto").length).toBe(2);
    expect(screen.getByText("ETF-Depot")).toBeDefined();
    expect(screen.getByText("Rentenversicherung")).toBeDefined();
  });

  it("displays cash invested including Vorabpauschale correctly", () => {
    render(<CashflowTable data={mockData} />);

    // Row 1: M1
    expect(screen.getByText("M1")).toBeDefined();
    // Row 2: M13
    expect(screen.getByText("M13")).toBeDefined();
    expect(screen.getByText("+50,00 € Depot-St.")).toBeDefined();
  });
});

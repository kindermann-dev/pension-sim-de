import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ComparisonChart } from "../ComparisonChart";
import type { CombinedDataPoint } from "../../../types/simulation";

describe("ComparisonChart Component", () => {
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
  ];

  it("renders headline and comparison titles cleanly", () => {
    render(<ComparisonChart data={mockData} ageStart={30} />);

    expect(screen.getByText("Lebenszyklus-Performance")).toBeDefined();
    expect(
      screen.getByText("Vermögensverlauf & Liquiditätsvergleich"),
    ).toBeDefined();
  });
});

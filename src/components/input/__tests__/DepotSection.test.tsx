import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DepotSection } from "../DepotSection";
import { INITIAL_DEPOT_PARAMETERS } from "../../../hooks/useSimulationParameters";

describe("DepotSection Component", () => {
  it("renders all depot parameters and advanceTaxFundingSource buttons", () => {
    const handleUpdate = vi.fn();
    render(
      <DepotSection
        depotParams={INITIAL_DEPOT_PARAMETERS}
        onUpdateDepot={handleUpdate}
      />,
    );

    expect(screen.getByText("ETF-Depot")).toBeDefined();
    expect(screen.getByText("Anteilsverkauf im Depot")).toBeDefined();
    expect(screen.getByText("Zahlung vom Girokonto")).toBeDefined();
    expect(screen.getByText("Zuzahlung in Police")).toBeDefined();
  });

  it("triggers onUpdateDepot when clicking on payment method buttons", () => {
    const handleUpdate = vi.fn();
    render(
      <DepotSection
        depotParams={INITIAL_DEPOT_PARAMETERS}
        onUpdateDepot={handleUpdate}
      />,
    );

    const giroButton = screen.getByText("Zahlung vom Girokonto");
    fireEvent.click(giroButton);
    expect(handleUpdate).toHaveBeenCalledWith(
      "advanceTaxFundingSource",
      "EXTERNAL_CASH",
    );

    const sellSharesButton = screen.getByText("Anteilsverkauf im Depot");
    fireEvent.click(sellSharesButton);
    expect(handleUpdate).toHaveBeenCalledWith(
      "advanceTaxFundingSource",
      "SELL_SHARES",
    );

    const matchedPoliceButton = screen.getByText("Zuzahlung in Police");
    fireEvent.click(matchedPoliceButton);
    expect(handleUpdate).toHaveBeenCalledWith(
      "advanceTaxFundingSource",
      "MATCHED_POLICE_CONTRIBUTION",
    );
  });
});

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ScenarioSelector } from "../ScenarioSelector";
import {
  INITIAL_GLOBAL_PARAMETERS,
  INITIAL_TAX_PARAMETERS,
  INITIAL_INSURANCE_PARAMETERS,
  INITIAL_PAYOUT_PARAMETERS,
} from "../../../hooks/useSimulationParameters";

describe("ScenarioSelector Component", () => {
  it("renders all 6 preset scenario cards", () => {
    render(
      <ScenarioSelector
        onSelectScenario={() => {}}
        currentGlobal={INITIAL_GLOBAL_PARAMETERS}
        currentTax={INITIAL_TAX_PARAMETERS}
        currentInsurance={INITIAL_INSURANCE_PARAMETERS}
        currentPayout={INITIAL_PAYOUT_PARAMETERS}
      />,
    );

    expect(
      screen.getByText("1. Basis-Szenario (Durchschnittssparer)"),
    ).toBeDefined();
    expect(
      screen.getByText("2. Steuer-Arbitrage (Hohe Altersbezüge)"),
    ).toBeDefined();
    expect(screen.getByText("3. Kurzläufer / Storno-Falle")).toBeDefined();
    expect(screen.getByText("4. Bullenmarkt & Vorabpauschale")).toBeDefined();
    expect(screen.getByText("5. Niedrigzins-Phase (Bärenmarkt)")).toBeDefined();
    expect(screen.getByText("6. Langlebigkeits-Stresstest")).toBeDefined();
  });

  it("triggers onSelectScenario when a scenario card is clicked", () => {
    const onSelect = vi.fn();
    render(
      <ScenarioSelector
        onSelectScenario={onSelect}
        currentGlobal={INITIAL_GLOBAL_PARAMETERS}
        currentTax={INITIAL_TAX_PARAMETERS}
        currentInsurance={INITIAL_INSURANCE_PARAMETERS}
        currentPayout={INITIAL_PAYOUT_PARAMETERS}
      />,
    );

    const stornoCard = screen.getByText("3. Kurzläufer / Storno-Falle");
    fireEvent.click(stornoCard);

    expect(onSelect).toHaveBeenCalled();
    expect(onSelect.mock.calls[0]?.[0]?.id).toBe("storno-falle");
  });

  it("opens and closes the detail info box when [?] button is clicked", () => {
    render(
      <ScenarioSelector
        onSelectScenario={() => {}}
        currentGlobal={INITIAL_GLOBAL_PARAMETERS}
        currentTax={INITIAL_TAX_PARAMETERS}
        currentInsurance={INITIAL_INSURANCE_PARAMETERS}
        currentPayout={INITIAL_PAYOUT_PARAMETERS}
      />,
    );

    const infoButtons = screen.getAllByText("[?]");
    expect(infoButtons.length).toBe(6);

    // Open info for first scenario
    fireEvent.click(infoButtons[0]!);
    expect(screen.getByText("Erwartetes Ergebnis:")).toBeDefined();

    // Close info box
    const closeBtn = screen.getByText("✕");
    fireEvent.click(closeBtn);
    expect(screen.queryByText("Erwartetes Ergebnis:")).toBeNull();
  });
});

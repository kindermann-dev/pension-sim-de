import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { InsuranceSection } from "../InsuranceSection";
import { INITIAL_INSURANCE_PARAMETERS } from "../../../hooks/useSimulationParameters";

describe("InsuranceSection Component", () => {
  it("renders all insurance parameters including special payment costs", () => {
    const handleUpdateInsurance = vi.fn();
    const handleUpdateWithdrawalFee = vi.fn();

    render(
      <InsuranceSection
        insuranceParams={INITIAL_INSURANCE_PARAMETERS}
        insuranceWithdrawalFeeRate={1.0}
        onUpdateInsurance={handleUpdateInsurance}
        onUpdateWithdrawalFeeRate={handleUpdateWithdrawalFee}
      />,
    );

    expect(screen.getByText("Rentenversicherung")).toBeDefined();
    expect(screen.getByText("Alpha Zuzahlung")).toBeDefined();
    expect(screen.getByText("Beta Zuzahlung")).toBeDefined();
    expect(screen.getByText("Gamma (Ansparphase)")).toBeDefined();
  });
});

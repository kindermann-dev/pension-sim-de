import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CheckInput } from "../CheckInput";

describe("CheckInput", () => {
  it("renders with label and checked state", () => {
    render(
      <CheckInput label="Test Option" checked={true} onChange={() => {}} />,
    );
    const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
    expect(screen.getByText("Test Option")).toBeDefined();
  });

  it("triggers onChange callback on user click", () => {
    const onChange = vi.fn();
    render(
      <CheckInput label="Test Option" checked={false} onChange={onChange} />,
    );
    const checkbox = screen.getByRole("checkbox") as HTMLInputElement;

    fireEvent.click(checkbox);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("renders tooltip information when provided", () => {
    render(
      <CheckInput
        label="With Tooltip"
        checked={true}
        onChange={() => {}}
        tooltip="This is explanatory help text"
      />,
    );

    expect(screen.getByRole("tooltip")).toBeDefined();
    expect(screen.getByText("This is explanatory help text")).toBeDefined();
  });
});

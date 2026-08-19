import { useState } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { NumInput } from "../NumInput";

const StatefulNumInputWrapper = ({
  initialValue,
  onValChange,
  symbol,
  debounceMs = 250,
}: {
  initialValue: number;
  onValChange?: (val: number) => void;
  symbol?: string;
  debounceMs?: number;
}) => {
  const [val, setVal] = useState(initialValue);
  return (
    <NumInput
      label="Sparrate"
      value={val}
      symbol={symbol}
      debounceMs={debounceMs}
      onChange={(newVal) => {
        setVal(newVal);
        onValChange?.(newVal);
      }}
    />
  );
};

describe("NumInput", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders with label, initial value and symbol", () => {
    render(
      <NumInput
        label="Startkapital"
        value={1000}
        onChange={() => {}}
        symbol="€"
      />,
    );

    expect(screen.getByLabelText("Startkapital")).toBeDefined();
    expect(screen.getByText("Startkapital")).toBeDefined();
    expect(screen.getByText("€")).toBeDefined();
    expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe(
      "1000",
    );
  });

  it("immediately updates input DOM and debounces callback", () => {
    const onValChange = vi.fn();
    render(
      <StatefulNumInputWrapper
        initialValue={100}
        onValChange={onValChange}
        debounceMs={200}
      />,
    );

    const input = screen.getByRole("textbox") as HTMLInputElement;

    // Type new value
    fireEvent.change(input, { target: { value: "250,50" } });
    // Input displays typed text immediately
    expect(input.value).toBe("250,50");
    // Callback not yet called before debounce timeout
    expect(onValChange).not.toHaveBeenCalled();

    // Advance timers
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(onValChange).toHaveBeenCalledWith(250.5);
  });

  it("does not trigger onChange if input is focused and blurred without value change", () => {
    const onValChange = vi.fn();
    render(
      <StatefulNumInputWrapper initialValue={250} onValChange={onValChange} />,
    );

    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.blur(input);

    expect(onValChange).not.toHaveBeenCalled();
  });

  it("immediately flushes value on blur without waiting for timer if value changed", () => {
    const onValChange = vi.fn();
    render(
      <StatefulNumInputWrapper initialValue={100} onValChange={onValChange} />,
    );

    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "500" } });
    fireEvent.blur(input);

    expect(input.value).toBe("500");
    expect(onValChange).toHaveBeenCalledWith(500);
  });

  it("handles blur and resets empty input to 0", () => {
    const onValChange = vi.fn();
    render(
      <StatefulNumInputWrapper initialValue={100} onValChange={onValChange} />,
    );

    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.blur(input);

    expect(input.value).toBe("0");
    expect(onValChange).toHaveBeenCalledWith(0);
  });

  it("handles invalid non-numeric text by resetting to 0 on blur", () => {
    const onValChange = vi.fn();
    render(
      <StatefulNumInputWrapper initialValue={100} onValChange={onValChange} />,
    );

    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "invalid_text" } });
    fireEvent.blur(input);

    expect(input.value).toBe("0");
    expect(onValChange).toHaveBeenCalledWith(0);
  });

  it("handles leading and trailing whitespace gracefully", () => {
    const onValChange = vi.fn();
    render(
      <StatefulNumInputWrapper initialValue={100} onValChange={onValChange} />,
    );

    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "  350.75  " } });
    fireEvent.blur(input);

    expect(input.value).toBe("350.75");
    expect(onValChange).toHaveBeenCalledWith(350.75);
  });

  it("flushes on Enter key press only when value changed", () => {
    const onValChange = vi.fn();
    render(
      <StatefulNumInputWrapper initialValue={100} onValChange={onValChange} />,
    );

    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "750" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onValChange).toHaveBeenCalledWith(750);
  });
});

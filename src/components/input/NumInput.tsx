import {
  useState,
  useEffect,
  useRef,
  useId,
  type ChangeEvent,
  type FocusEvent,
  type KeyboardEvent,
} from "react";

export interface NumInputProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  symbol?: string;
  id?: string;
  ariaLabel?: string;
  debounceMs?: number;
}

export const NumInput = ({
  label,
  value,
  onChange,
  symbol = "",
  id,
  ariaLabel,
  debounceMs = 500,
}: NumInputProps) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [localValue, setLocalValue] = useState<string>(value.toString());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFocusedRef = useRef(false);
  const localValueRef = useRef(localValue);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    localValueRef.current = localValue;
  }, [localValue]);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // synchronize external value changes (e.g. preset reset) without clobbering active user typing
  useEffect(() => {
    if (isFocusedRef.current) {
      const parsed = parseFloat(localValueRef.current.replace(",", "."));
      if (!isNaN(parsed) && parsed === value) {
        return;
      }
    }
    setLocalValue(value.toString());
  }, [value]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const parseAndNotify = (raw: string) => {
    const normalized = raw.replace(",", ".").trim();
    let parsed = 0;
    if (normalized !== "" && normalized !== "-") {
      const num = parseFloat(normalized);
      if (!isNaN(num)) {
        parsed = num;
      }
    }

    // only notify if value actually changed
    if (parsed !== valueRef.current) {
      onChangeRef.current(parsed);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocalValue(raw);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (debounceMs <= 0) {
      parseAndNotify(raw);
      return;
    }

    timerRef.current = setTimeout(() => {
      parseAndNotify(raw);
    }, debounceMs);
  };

  const handleFocus = () => {
    isFocusedRef.current = true;
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    isFocusedRef.current = false;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const raw = e.target.value;
    const normalized = raw.replace(",", ".").trim();
    const num = parseFloat(normalized);
    const parsed = isNaN(num) || normalized === "" ? 0 : num;

    setLocalValue(parsed.toString());

    // only notify if value actually changed
    if (parsed !== valueRef.current) {
      onChangeRef.current(parsed);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      parseAndNotify(localValue);
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div className="flex flex-col mb-3">
      <label
        htmlFor={inputId}
        className="text-xs font-semibold text-gray-600 mb-1"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type="text"
          inputMode="decimal"
          aria-label={ariaLabel ?? label}
          value={localValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`w-full py-1.5 pl-2.5 ${symbol ? "pr-9" : "pr-2.5"} border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-gray-900`}
        />
        {symbol && (
          <span className="absolute right-2.5 top-1.5 text-gray-400 text-sm pointer-events-none font-medium">
            {symbol}
          </span>
        )}
      </div>
    </div>
  );
};

import { useId, type ReactNode } from "react";

export interface CheckInputProps {
  label: string;
  checked: boolean;
  onChange: (val: boolean) => void;
  id?: string;
  ariaLabel?: string;
  tooltip?: ReactNode;
}

export const CheckInput = ({
  label,
  checked,
  onChange,
  id,
  ariaLabel,
  tooltip,
}: CheckInputProps) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const tooltipId = `${inputId}-tooltip`;

  return (
    <div className="flex items-center justify-between mb-3">
      <label
        htmlFor={inputId}
        className="flex items-center space-x-2 cursor-pointer select-none"
      >
        <input
          id={inputId}
          type="checkbox"
          checked={checked}
          aria-label={ariaLabel ?? label}
          aria-describedby={tooltip ? tooltipId : undefined}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
        />
        <span className="text-sm font-semibold text-gray-700">{label}</span>
      </label>

      {tooltip && (
        <div
          className="relative group inline-flex items-center ml-1.5"
          tabIndex={0}
          aria-label="Hilfe-Information"
        >
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600 focus:text-blue-600 focus:outline-hidden cursor-help p-0.5"
            aria-label="Info anzeigen"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="12" cy="12" r="10" strokeWidth="2" />
              <path strokeWidth="2" d="M12 16v-4m0-4h.01" />
            </svg>
          </button>

          <div
            id={tooltipId}
            role="tooltip"
            className="absolute right-0 bottom-full mb-2 hidden group-hover:block group-focus:block group-focus-within:block w-72 max-w-[85vw] p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-30 pointer-events-none transition-opacity duration-200"
          >
            <div className="font-normal leading-relaxed text-gray-200">
              {tooltip}
            </div>
            <div className="absolute right-2 top-full border-4 border-transparent border-t-gray-900" />
          </div>
        </div>
      )}
    </div>
  );
};

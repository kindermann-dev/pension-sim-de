import { useState, useCallback } from "react";
import type { LegalContactKey } from "../../types/legal";
import { getEncodedLegalConfig, decodeBase64 } from "../../config/legalConfig";

interface ObfuscatedContactProps {
  fieldKey: LegalContactKey;
  type?: "text" | "email" | "phone";
  label?: string;
  isRevealed?: boolean;
  onReveal?: () => void;
  className?: string;
}

export function ObfuscatedContact({
  fieldKey,
  type = "text",
  label,
  isRevealed: controlledRevealed = false,
  onReveal,
  className = "",
}: ObfuscatedContactProps) {
  const [internalRevealed, setInternalRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const isRevealed = controlledRevealed || internalRevealed;

  const handleReveal = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setInternalRevealed(true);
      onReveal?.();
    },
    [onReveal],
  );

  const rawEncoded = getEncodedLegalConfig()[fieldKey] || "";
  const decodedValue = isRevealed ? decodeBase64(rawEncoded) : "";

  const handleCopy = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!decodedValue) return;
      try {
        await navigator.clipboard.writeText(decodedValue);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Fallback for older browsers
        const textarea = document.createElement("textarea");
        textarea.value = decodedValue;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    },
    [decodedValue],
  );

  return (
    <span className={`inline-flex items-center flex-wrap gap-2 ${className}`}>
      {/* Invisible Honeypot for dumb non-JS / raw DOM scrapers */}
      <span
        className="hidden select-none"
        aria-hidden="true"
        style={{ display: "none" }}
      >
        bot-trap@example.invalid
      </span>

      {label && <span className="text-gray-700 font-medium">{label}</span>}

      {!isRevealed ? (
        <button
          type="button"
          onClick={handleReveal}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md shadow-xs transition-colors cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          aria-expanded={false}
          aria-label={`Klicken um ${label || fieldKey} anzuzeigen (Spamschutz)`}
          title="Klicken zum Entschlüsseln (Spamschutz)"
        >
          <svg
            className="w-3.5 h-3.5 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          <span>Klicken zum Anzeigen</span>
        </button>
      ) : (
        <span className="inline-flex items-center gap-2 font-mono text-gray-900 bg-gray-50 px-2 py-0.5 rounded-sm border border-gray-200">
          {type === "email" ? (
            <a
              href={`mailto:${decodedValue}`}
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              {decodedValue}
            </a>
          ) : type === "phone" ? (
            <a
              href={`tel:${decodedValue.replace(/\s+/g, "")}`}
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              {decodedValue}
            </a>
          ) : (
            <span>{decodedValue}</span>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center p-1 text-gray-500 hover:text-gray-900 rounded-sm hover:bg-gray-200 transition-colors cursor-pointer"
            aria-label={`${label || fieldKey} in die Zwischenablage kopieren`}
            title="In Zwischenablage kopieren"
          >
            {copied ? (
              <svg
                className="w-3.5 h-3.5 text-emerald-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                />
              </svg>
            )}
          </button>
        </span>
      )}
    </span>
  );
}

import { useState } from "react";
import { ObfuscatedContact } from "./ObfuscatedContact";

export function ImpressumContent() {
  const [revealAll, setRevealAll] = useState(false);

  return (
    <div className="space-y-6 text-gray-800 text-sm leading-relaxed">
      {/* Top Banner & Global Reveal Control */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <svg
            className="w-5 h-5 text-blue-600 shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          <div>
            <p className="text-xs font-semibold text-blue-900">
              Spamschutz nach deutschem Recht
            </p>
            <p className="text-xs text-blue-700 mt-0.5">
              Kontaktdaten sind gegen automatisierte Scraper geschützt und
              werden per Klick direkt im Browser dekodiert.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setRevealAll((prev) => !prev)}
          className="self-start sm:self-auto shrink-0 px-3 py-1.5 text-xs font-medium text-blue-700 bg-white border border-blue-300 rounded-lg shadow-xs hover:bg-blue-100/50 transition-colors cursor-pointer"
        >
          {revealAll ? "Kontaktdaten verbergen" : "Alle Daten aufdecken"}
        </button>
      </div>

      <noscript>
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-800 text-xs">
          Hinweis: Zur Anzeige der geschützten Kontaktdaten aktivieren Sie bitte
          JavaScript in Ihrem Browser.
        </div>
      </noscript>

      {/* Angaben gemäß § 5 DDG */}
      <section className="space-y-3">
        <h3 className="text-base font-bold text-gray-900 border-b border-gray-200 pb-1.5">
          Angaben gemäß § 5 DDG
        </h3>
        <div className="space-y-1 font-sans">
          <div>
            <ObfuscatedContact fieldKey="name" isRevealed={revealAll} />
          </div>
          <div>
            <ObfuscatedContact fieldKey="street" isRevealed={revealAll} />
          </div>
          <div>
            <ObfuscatedContact fieldKey="city" isRevealed={revealAll} />
          </div>
          <div>
            <ObfuscatedContact fieldKey="country" isRevealed={revealAll} />
          </div>
        </div>
      </section>

      {/* Kontakt */}
      <section className="space-y-3">
        <h3 className="text-base font-bold text-gray-900 border-b border-gray-200 pb-1.5">
          Kontakt
        </h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-20 font-medium text-gray-700">Telefon:</span>
            <ObfuscatedContact
              fieldKey="phone"
              type="phone"
              isRevealed={revealAll}
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-20 font-medium text-gray-700">E-Mail:</span>
            <ObfuscatedContact
              fieldKey="email"
              type="email"
              isRevealed={revealAll}
            />
          </div>
        </div>
      </section>

      {/* Redaktionell verantwortlich gemäß § 18 Abs. 2 MStV */}
      <section className="space-y-3">
        <h3 className="text-base font-bold text-gray-900 border-b border-gray-200 pb-1.5">
          Redaktionell verantwortlich gemäß § 18 Abs. 2 MStV
        </h3>
        <div className="space-y-1 font-sans">
          <div>
            <ObfuscatedContact
              fieldKey="editorialName"
              isRevealed={revealAll}
            />
          </div>
          <div>
            <ObfuscatedContact
              fieldKey="editorialStreet"
              isRevealed={revealAll}
            />
          </div>
          <div>
            <ObfuscatedContact
              fieldKey="editorialCity"
              isRevealed={revealAll}
            />
          </div>
          <div>
            <ObfuscatedContact
              fieldKey="editorialCountry"
              isRevealed={revealAll}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

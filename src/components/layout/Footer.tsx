import type { LegalTab } from "../legal/LegalModal";

interface FooterProps {
  onOpenLegal: (tab: LegalTab) => void;
}

export function Footer({ onOpenLegal }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-12 pt-8 pb-12 border-t border-gray-200 text-gray-500 text-xs sm:text-sm">
      <div className="max-w-[2100px] w-full mx-auto px-4 space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Copyright */}
          <div className="text-center md:text-left">
            <p className="font-medium text-gray-700">
              © {currentYear} Altersvorsorge-Simulator (pension-sim-de)
            </p>
          </div>

          {/* Legal links */}
          <nav
            className="flex items-center gap-6 text-sm font-medium"
            aria-label="Rechtliche Links"
          >
            <button
              type="button"
              onClick={() => onOpenLegal("impressum")}
              className="text-gray-600 hover:text-blue-600 transition-colors cursor-pointer hover:underline focus:outline-hidden focus:ring-2 focus:ring-blue-500 rounded-sm"
            >
              Impressum
            </button>
            <span className="text-gray-300" aria-hidden="true">
              |
            </span>
            <button
              type="button"
              onClick={() => onOpenLegal("datenschutz")}
              className="text-gray-600 hover:text-blue-600 transition-colors cursor-pointer hover:underline focus:outline-hidden focus:ring-2 focus:ring-blue-500 rounded-sm"
            >
              Datenschutzerklärung
            </button>
          </nav>
        </div>

        {/* Disclaimer text */}
        <div className="text-xs text-gray-500 leading-relaxed border-t border-gray-100 pt-3 text-center md:text-left">
          <p>
            <strong className="font-semibold text-gray-600">
              Haftungsausschluss:
            </strong>{" "}
            Dieses Tool dient ausschließlich zu Informations- und
            Simulationszwecken und stellt keine Anlage-, Rechts- oder
            Steuerberatung dar. Alle Berechnungen basieren auf den eingegebenen
            Annahmen und erfolgen ohne Gewähr. Finanzielle Entscheidungen
            triffst du auf eigenes Risiko.
          </p>
        </div>
      </div>
    </footer>
  );
}

import { useState } from "react";
import { ObfuscatedContact } from "./ObfuscatedContact";

export function PrivacyPolicyContent() {
  const [revealContact, setRevealContact] = useState(false);

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
          onClick={() => setRevealContact((prev) => !prev)}
          className="self-start sm:self-auto shrink-0 px-3 py-1.5 text-xs font-medium text-blue-700 bg-white border border-blue-300 rounded-lg shadow-xs hover:bg-blue-100/50 transition-colors cursor-pointer"
        >
          {revealContact ? "Kontaktdaten verbergen" : "Alle Daten aufdecken"}
        </button>
      </div>

      <noscript>
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-800 text-xs">
          Hinweis: Zur Anzeige der geschützten Kontaktdaten aktivieren Sie bitte
          JavaScript in Ihrem Browser.
        </div>
      </noscript>

      {/* 1. Verantwortlicher */}
      <section className="space-y-3">
        <h3 className="text-base font-bold text-gray-900 border-b border-gray-200 pb-1.5">
          1. Verantwortlicher
        </h3>
        <div className="space-y-1 font-sans">
          <div>
            <ObfuscatedContact fieldKey="name" isRevealed={revealContact} />
          </div>
          <div>
            <ObfuscatedContact fieldKey="street" isRevealed={revealContact} />
          </div>
          <div>
            <ObfuscatedContact fieldKey="city" isRevealed={revealContact} />
          </div>
          <div>
            <ObfuscatedContact fieldKey="country" isRevealed={revealContact} />
          </div>
          <div className="pt-1 flex items-center gap-2 flex-wrap">
            <span className="font-medium text-gray-700">E-Mail:</span>
            <ObfuscatedContact
              fieldKey="privacyEmail"
              type="email"
              isRevealed={revealContact}
            />
          </div>
        </div>
      </section>

      {/* 2. Clientseitige Datenverarbeitung & Cookies */}
      <section className="space-y-3">
        <h3 className="text-base font-bold text-gray-900 border-b border-gray-200 pb-1.5">
          2. Clientseitige Datenverarbeitung &amp; Cookies
        </h3>
        <p>
          Diese Website besteht aus statischen Dateien. Die Verarbeitung von
          Eingaben in der Webanwendung durch JavaScript erfolgt ausschließlich
          lokal in Ihrem Browser. Es werden keine dieser eingegebenen Daten an
          unsere Server oder an Dritte übermittelt.
        </p>
        <p>
          Es werden keine Cookies eingesetzt, kein Web Storage
          (LocalStorage/SessionStorage) für Tracking-Zwecke verwendet und keine
          Analysedienste Dritter eingebunden.
        </p>
      </section>

      {/* 3. Hosting auf GitHub Pages */}
      <section className="space-y-3">
        <h3 className="text-base font-bold text-gray-900 border-b border-gray-200 pb-1.5">
          3. Hosting auf GitHub Pages
        </h3>
        <p>
          Wir setzen für die Bereitstellung unserer Website folgenden Hoster
          ein:
        </p>
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 font-sans space-y-0.5 text-xs text-gray-700">
          <p className="font-semibold text-gray-900">GitHub Inc.</p>
          <p>88 Colin P Kelly Jr St</p>
          <p>San Francisco, CA 94107</p>
          <p>USA</p>
        </div>
        <p>
          Dieser ist Empfänger Ihrer personenbezogenen Daten. Dies entspricht
          unserem berechtigten Interesse im Sinne des Art. 6 Abs. 1 S. 1 lit. f
          DSGVO, selbst keinen Server in unseren Räumlichkeiten vorhalten zu
          müssen. Der Serverstandort ist unter anderem die USA.
        </p>
        <p>
          Unser Hoster erhebt in sogenannten Logfiles folgende Daten, die Ihr
          Browser automatisch übermittelt: IP-Adresse, die Adresse der vorher
          besuchten Website (Referer Anfrage-Header), Datum und Uhrzeit der
          Anfrage, Zeitzonendifferenz zur Greenwich Mean Time, Inhalt der
          Anforderung, HTTP-Statuscode, übertragene Datenmenge, Website, von der
          die Anforderung kommt, sowie Informationen zu Browser und
          Betriebssystem.
        </p>
        <p>
          Das ist erforderlich, um unsere Website anzuzeigen und die Stabilität
          und Sicherheit zu gewährleisten. Dies entspricht unserem berechtigten
          Interesse im Sinne des Art. 6 Abs. 1 S. 1 lit. f DSGVO. Es erfolgt
          kein Tracking und wir haben auf diese Daten keinen direkten Zugriff.
          Die Daten werden gelöscht, sobald der Zweck der Verarbeitung entfällt.
          Die Verarbeitung der unter diesem Abschnitt angegebenen Daten ist
          weder gesetzlich noch vertraglich vorgeschrieben. Die
          Funktionsfähigkeit der Website ist ohne die Verarbeitung jedoch nicht
          gewährleistet.
        </p>
        <div className="space-y-1.5 pt-1">
          <h4 className="font-semibold text-gray-900 italic">
            Internationaler Datentransfer:
          </h4>
          <p>
            GitHub ist nach dem „EU-US Data Privacy Framework“ zertifiziert.
            Dies ist ein Datenschutzabkommen, das ein angemessenes
            Datenschutzniveau bei Datenübermittlungen an zertifizierte
            US-Unternehmen sicherstellt. Zusätzlich stützt sich GitHub auf
            EU-Standardvertragsklauseln (SCCs).
          </p>
          <p>
            Weitere Informationen zum Datenschutz bei GitHub finden Sie in der
            Datenschutzerklärung des Anbieters:
          </p>
          <p>
            <a
              href="https://docs.github.com/de/site-policy/privacy-policies/github-general-privacy-statement"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline break-all"
            >
              https://docs.github.com/de/site-policy/privacy-policies/github-general-privacy-statement
            </a>
          </p>
        </div>
      </section>

      {/* 4. SSL- bzw. TLS-Verschlüsselung */}
      <section className="space-y-3">
        <h3 className="text-base font-bold text-gray-900 border-b border-gray-200 pb-1.5">
          4. SSL- bzw. TLS-Verschlüsselung
        </h3>
        <p>
          Diese Seite nutzt aus Sicherheitsgründen eine SSL- bzw.
          TLS-Verschlüsselung (HTTPS). Eine verschlüsselte Verbindung erkennen
          Sie an der Adresszeile des Browsers (
          <code className="bg-gray-100 px-1 py-0.5 rounded-sm text-xs font-mono text-gray-800">
            https://
          </code>
          ) und dem Schloss-Symbol.
        </p>
      </section>

      {/* 5. Ihre Rechte */}
      <section className="space-y-3">
        <h3 className="text-base font-bold text-gray-900 border-b border-gray-200 pb-1.5">
          5. Ihre Rechte
        </h3>
        <p>
          Werden Ihre personenbezogenen Daten verarbeitet, stehen Ihnen als
          betroffene Person im Sinne der DSGVO folgende Rechte zu:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 pl-1">
          <li>
            <strong className="text-gray-900">Recht auf Auskunft</strong> (Art.
            15 DSGVO)
          </li>
          <li>
            <strong className="text-gray-900">Recht auf Berichtigung</strong>{" "}
            (Art. 16 DSGVO)
          </li>
          <li>
            <strong className="text-gray-900">Recht auf Löschung</strong> (Art.
            17 DSGVO)
          </li>
          <li>
            <strong className="text-gray-900">
              Recht auf Einschränkung der Verarbeitung
            </strong>{" "}
            (Art. 18 DSGVO)
          </li>
          <li>
            <strong className="text-gray-900">
              Recht auf Datenübertragbarkeit
            </strong>{" "}
            (Art. 20 DSGVO)
          </li>
          <li>
            <strong className="text-gray-900">
              Recht auf Widerspruch gegen die Verarbeitung
            </strong>{" "}
            (Art. 21 DSGVO)
          </li>
          <li>
            <strong className="text-gray-900">
              Recht auf Beschwerde bei einer Datenschutz-Aufsichtsbehörde
            </strong>{" "}
            (Art. 77 DSGVO)
          </li>
        </ul>
        <p className="pt-1">
          Zur Ausübung Ihrer Rechte können Sie sich jederzeit formlos an die
          unter Abschnitt 1 angegebenen Kontaktdaten wenden.
        </p>
      </section>
    </div>
  );
}

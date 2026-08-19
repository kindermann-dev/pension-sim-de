# Altersvorsorge-Simulator (`pension-sim-de`)

Ein finanzmathematisches Vergleichswerkzeug zur objektiven Gegenüberstellung eines **eigenständig verwalteten ETF-Depots** und einer **fondsgebundenen Rentenversicherung**. Die Berechnung betrachtet den gesamten Vermögensverlauf – von den monatlichen Sparraten beim Vermögensaufbau bis hin zur regelmäßigen Rentenzahlung im Ruhestand.

## :warning: Rechtlicher Hinweis & Haftungsausschluss

1. Keine Anlage- oder Steuerberatung
   Dieses Tool und die generierten Berechnungen dienen ausschließlich zu Informations-, Analyse- und Simulationszwecken. Sie stellen keine Anlageberatung, Anlageempfehlung oder steuerliche Beratung im Sinne des Wertpapierhandelsgesetzes (WpHG) oder sonstiger gesetzlicher Bestimmungen dar. Das Tool ersetzt keine professionelle Beratung durch qualifizierte Finanz- oder Steuerberater.

2. Keine Gewähr für Richtigkeit und Vollständigkeit
   Alle mathematischen Projektionen basieren auf deterministischen Modellen und den vom Nutzer festgelegten Parametern. Historische Daten, angenommene Renditen oder geltende Steuergesetze bieten keine Garantie für zukünftige Entwicklungen. Es wird keine Haftung für die Richtigkeit, Vollständigkeit, Aktualität oder die korrekte steuerliche Abbildung der Ergebnisse übernommen.

3. Gesetzliche Änderungen
   Die steuerlichen Berechnungen (z. B. Vorabpauschale, Abgeltungsteuer, Halbeinkünfteverfahren) basieren auf dem deutschen Steuerrecht. Zukünftige legislative Änderungen können die realen Ergebnisse signifikant von der Simulation abweichen lassen.

4. Eigenverantwortung
   Die Nutzung der Ergebnisse erfolgt auf eigenes Risiko. Für Vermögensschäden, die aus Anlageentscheidungen auf Basis dieser Simulation resultieren, wird keine Haftung übernommen.

## Ziel und Motivation

Die Entscheidung zwischen einem privaten ETF-Sparplan und einer fondsgebundenen Rentenversicherung wird in der Praxis häufig durch vereinfachte Beispielrechnungen verfälscht. Dieses Projekt bietet ein transparentes Berechnungsmodell, das die realen Vor- und Nachteile beider Anlageformen vergleichbar macht.

Dabei stehen zwei Faktoren im Mittelpunkt:

1. **Reale Kostenstrukturen:** Berücksichtigung aller Abschluss-, Verwaltungs-, Transaktions- und Depotkosten sowie Zillmer-Verfahren und Überschüsse.
2. **Deutsches Steuerrecht:** Detaillierte und rechtskonforme Abbildung der steuerlichen Behandlung von Depots (speziell ETF) und Rentenversicherungsverträgen während der gesamten Laufzeit.

## Berücksichtigung des deutschen Steuerrechts

Ein wesentlicher Unterschied zu vereinfachten Online-Rechnern ist die präzise Umsetzung der deutschen Steuergesetze:

### Investmentsteuergesetz (InvStG)

- **Vorabpauschale (§ 18 InvStG):**  
  Für thesaurierende sowie ausschüttende ETFs im Depot wird zum Jahresende die Vorabpauschale ermittelt. Die Berechnung nutzt den Basiszins der Deutschen Bundesbank, den gesetzlichen Faktor von 70 % sowie eine monatsgenaue Gewichtung für Zukäufe im laufenden Jahr.
- **Tranchenspezifischer Nachweis von Voraberträgen:**  
  Jede monatlich erworbene Anteilstranche speichert die auf sie entfallenden, bereits versteuerten Vorabpauschalen. Beim späteren Verkauf im Rahmen des Entnahmeplans wird dieser Betrag vom Veräußerungsgewinn abgezogen, sodass keine steuerliche Doppelbelastung entsteht.
- **Teilfreistellungsquoten (§ 20 InvStG):**
  - **30 % Teilfreistellung** für Aktienfonds im ETF-Depot.
  - **15 % Teilfreistellung** für Fondserträge innerhalb der Rentenversicherung.

### Einkommensteuergesetz (EStG)

- **Abgeltungsteuer (§ 32d EStG):**  
  Laufende Erträge und Veräußerungsgewinne im Depot unterliegen der Abgeltungsteuer in Höhe von 25 % zuzüglich Solidaritätszuschlag (5,5 % auf die Steuer), sowie optionaler Kirchensteuer.
- **Besteuerung der Rentenpolice nach dem Halbeinkünfteverfahren (§ 20 Abs. 1 Nr. 6 EStG):**  
  Sofern der Vertrag mindestens 12 Jahre bestanden hat und die Auszahlung nach Vollendung des 62. Lebensjahres erfolgt (12/62-Regel), ist die Hälfte des Ertrags steuerfrei. Der verbleibende Ertragsanteil wird nach Abzug der 15-prozentigen Teilfreistellung mit dem persönlichen Grenzsteuersatz im Ruhestand versteuert.
- **Sparer-Pauschbetrag (§ 20 Abs. 9 EStG):**  
  Der jährliche Freistellungsauftrag (z. B. 1.000 €) wird dynamisch erfasst und sowohl in der Ansparphase als auch in der Entnahmephase mit anfallenden steuerpflichtigen Erträgen verrechnet.

## Fachliche Modellierung und Rechenlogik

### 1. Ansparphase (Vermögensaufbau)

- Monatliche Sparraten und optionales Startkapital.
- Jährliche Anpassung der Sparrate über eine feste Dynamik oder automatisch gekoppelt an die Inflationsrate.
- Berechnung monatlicher Zinseszinsen aus der vorgegebenen Marktrendite abzüglich Tracking Difference.
- Erfassung von Kaufordergebühren, Geld-Brief-Spannen (Spread) und laufenden Depotführungsgebühren.

### 2. Entnahmephase (Ruhestandsplanung)

- Flexible Auszahlung im monatlichen oder jährlichen Intervall über einen festen Zeitraum.
- Optionale Steigerung der Entnahmebeträge zum Inflationsausgleich.
- **Wahl zwischen Brutto- und Netto-Rente:**  
  Bei Auswahl einer festen Netto-Wunschrente berechnet der Rechner iterativ (mittels binärer Suche) genau den Brutto-Entnahmebetrag, der nach Abzug aller individuellen Steuern und Transaktionsgebühren exakt den gewünschten Betrag auf dem Girokonto ergibt.

### 3. Anteilsverwaltung nach dem FIFO-Prinzip

Verkäufe aus dem ETF-Depot erfolgen strikt nach dem Prinzip _First In – First Out_ (zuerst gekaufte Anteile werden zuerst veräußert). Das Modell verwaltet jede Tranche einzeln mit Kaufmonat, Anteilssumme, Einstandskurs und den aufgelaufenen Vorabpauschalen.

### 4. Detaillierte Kostenstruktur der Rentenversicherung

- **Alpha-Kosten:** Abschluss- und Vertriebskosten, aufgeteilt in die ersten 5 Jahre (Zillmerung gemäß gesetzlicher Vorgaben) sowie laufende Abschlusskosten über die Vertragslaufzeit.
- **Beta-Kosten:** Verwaltungskosten als prozentualer Anteil jeder Beitragszahlung sowie feste jährliche Stückkosten.
- **Gamma-Kosten:** Monatliche Verwaltungskosten, berechnet auf das jeweils vorhandene Fondsguthaben (Assets under Management).
- **Überschussbeteiligung:** Jährliche Zuweisung von Überschussanteilen in Form zusätzlicher Fondsanteile.
- **Auszahlungskosten:** Prozentuale oder gedeckelte Gebühren für Entnahmen in der Rentenphase.

## Technische Architektur

Die Codebasis ist in funktionale, klar abgegrenzte Schichten unterteilt:

```
src/
├── types/                      # TypeScript-Definitionen für Parameter und Simulationsdaten
│   ├── simulationParameters.ts # Eingabeparameter (Global, Depot, Police, Steuern, Entnahme)
│   └── simulation.ts           # Tranchen, Depot- und Policenstatus, Zeitreihendaten
├── logic/
│   ├── math/                   # Finanzberechnungen
│   └── simulation/             # Monatliche Simulationsschleifen für Anspar- und Entnahmephase
├── hooks/
│   └── useSimulationParameters.ts # Verwaltung der Formularparameter mit Standardwerten
├── components/
│   ├── input/                  # Formularabschnitte und Eingabesteuerelemente
│   └── output/                 # Grafische Auswertung und Tabellenansicht
└── App.tsx                     # Zusammenführung von Zustand, Simulation und Darstellung
```

## Verwendete Technologien

- **Benutzeroberfläche:** React 19, TypeScript 6
- **Design & Layout:** Tailwind CSS v4
- **Diagramme:** Recharts 3
- **Build-System:** Vite 8 (Rolldown)
- **Test-Framework:** Vitest 4 (Happy-DOM)
- **Codequalität & Tooling:** Oxlint, Stylelint, HTMLHint, Prettier, Husky, Lint-Staged

## Lokale Einrichtung und Befehle

### Voraussetzungen

- Node.js (Version 24 oder neuer)
- npm

### Installation

```bash
git clone https://github.com/kindermann-dev/pension-sim-de.git
cd pension-sim-de
npm install
```

### Entwicklungsbefehle

- `npm run dev`: Startet die lokale Entwicklungsumgebung mit Hot Module Replacement (Vite).
- `npm run build`: Führt die TypeScript-Typprüfung durch und erstellt das optimierte Produktions-Bundle (`tsc -b && vite build`).
- `npm run preview`: Startet einen lokalen Vorschau-Server für das erstellte Produktions-Bundle.
- `npm run test` / `npm run test:ci`: Führt alle Unit- und Integrationstests im Headless-Modus aus (Vitest).
- `npm run test:watch`: Startet den Vitest-Test-Runner im interaktiven Beobachtungsmodus.
- `npm run lint`: Prüft den gesamten Code mit Oxlint (JS/TS), Stylelint (CSS) und HTMLHint (HTML).
- `npm run lint:fix`: Behebt automatisch reparierbare Linter-Fehler in JS/TS und CSS.
- `npm run format`: Formatiert alle Quellcode-, Stylesheet- und Markdown-Dateien mit Prettier.
- `npm run format:check`: Prüft, ob alle Dateien den Prettier-Formatierungsregeln entsprechen.
- `npm run release:check`: Führt den vollständigen Verifikations- und QA-Durchlauf aus (Linting + Testing + Build + Audit).
- `npm run analyze`: Erstellt das Produktions-Bundle im Analyse-Modus zur Visualisierung der Chunk- und Asset-Größen.
- `npm run audit`: Prüft alle Abhängigkeiten auf bekannte Sicherheitslücken (`npm audit`).
- `npm run audit:fix`: Behebt bekannte Sicherheitslücken in Abhängigkeiten automatisch (`npm audit fix`).
- `npm run clean`: Bereinigt Build-Artefakte und Test-Coverage (`dist/`, `coverage/`).
- `npm run prepare`: Initialisiert die lokalen Git-Hooks via Husky.

## Qualitätssicherung

Sämtliche finanzmathematischen Funktionen, steuerlichen Berechnungen, FIFO-Verkaufsregeln und Simulationsabläufe sind durch automatisierte Tests abgedeckt. Die Ausführung erfolgt über:

```bash
npm run test
```

## Entwicklung & Methodik

Dieses Projekt entstand in einer hybriden Arbeitsweise (_AI-assisted Development_):

- **Architektur, Domänenlogik & Reviews:** Manuell konzipiert, entwickelt und anhand manueller Berechnungen verifiziert.
- **Implementierungs-Support:** Große Sprachmodelle (LLMs) wurden als interaktiver Sparringspartner und für Code-Scaffolding (insbesondere der UI-Elemente) genutzt.

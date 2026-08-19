# Project Context & Agent Instructions

## 1. Project Overview & Mission

- **Purpose:** High-precision financial lifecycle simulation comparing a self-managed ETF portfolio (_ETF-Depot_) against a unit-linked pension insurance (_fondsgebundene Rentenversicherung_).
- **Scope:** Full lifecycle simulation on a monthly discrete-time basis across both accumulation (_Ansparphase_) and withdrawal/payout (_Entnahmephase_) phases.
- **Tech Stack:** React 19.2, TypeScript 6 (Strict Mode), Vite 8.2, Tailwind CSS v4.3, Recharts 3, Oxlint, Stylelint, HTMLHint, Prettier, Husky, Lint-Staged, Vitest 4.1 (Happy-DOM).
- **CI/CD & Maintenance:** Continuous Integration (`.github/workflows/ci.yml`), Scheduled maintenance updates (`.github/workflows/scheduled-npm-update.yml`), Dependabot Auto-Merge (`.github/workflows/dependabot-auto-merge.yml`), and Dependabot config (`.github/dependabot.yml`).

---

## 2. Architecture & Directory Structure

```
src/
├── types/
│   ├── simulationParameters.ts   # Parameter interfaces (Global, Depot, Insurance, Tax, Payout)
│   ├── simulation.ts             # Tranches, Depot/Insurance states, DataPoints, KPIs, BreakEven
│   └── legal.ts                  # LegalContactInfo & LegalContactKey types
├── constants/
│   └── scenarios.ts              # 6 Preset scenarios for stress tests & benchmarking
├── config/
│   ├── legalConfig.ts            # Base64 contact obfuscation & CI/CD injection (__LEGAL_CONFIG_B64__)
│   └── __tests__/                # Unit tests for legal config & Base64 decoding
├── hooks/
│   ├── useSimulationParameters.ts# State orchestration for parameters & default configs
│   ├── useDebounce.ts            # Debounce hook for delayed updates
│   └── __tests__/
├── logic/
│   ├── math/                     # Pure, stateless financial mathematics engines
│   │   ├── commonMath.ts         # Return rates, dynamics, Abgeltungsteuer with church tax
│   │   ├── depotMath.ts          # Vorabpauschale, FIFO tranche sales, advance yield tracking
│   │   ├── insuranceMath.ts      # Alpha/Beta/Gamma/Surplus cost math, Halbeinkünfte tax
│   │   ├── payoutMath.ts         # Binary search gross-up for target net withdrawals
│   │   ├── kpiMath.ts            # 5 Extended KPIs (XIRR, Break-Even, Liquidation, Rentenfaktor, Sum)
│   │   └── __tests__/            # Unit tests for pure math functions
│   └── simulation/               # Stateful monthly simulation loops
│       ├── depot.ts                 # Monthly depot growth & payout, FIFO liquidation, Jan Vorabpauschale, fund switches
│       ├── insurance.ts             # Monthly insurance growth & payout, Alpha/Beta/Gamma, surplus, Halbeinkünfte
│       └── __tests__/               # Integration tests for simulation engines
├── components/
│   ├── layout/
│   │   └── Footer.tsx            # Global footer with disclaimer & legal modal triggers
│   ├── legal/
│   │   ├── LegalModal.tsx        # Accessible dialog with #impressum / #datenschutz hash routing
│   │   ├── ImpressumContent.tsx  # § 5 TMG / § 18 MStV legal notice with print button
│   │   ├── PrivacyPolicyContent.tsx # DSGVO / GDPR privacy policy for client-side app
│   │   ├── ObfuscatedContact.tsx # Spam-protected contact reveal button & honeypot trap
│   │   └── __tests__/            # Tests for legal modal and obfuscation
│   ├── input/
│   │   ├── ParameterForm.tsx     # Tabbed parameter sidebar (All, Global, Payout, Depot, Insurance, Tax)
│   │   ├── GlobalSection.tsx     # Age, savings, returns, inflation, fund switch interval
│   │   ├── DepotSection.tsx      # Tracking difference, order fees, spread, TFS, accumulation
│   │   ├── InsuranceSection.tsx  # Alpha (Zillmer/running), Beta (%/fixed), Gamma, surplus, switch fee
│   │   ├── TaxSection.tsx        # Tax rates, Soli, Church tax, FSA, retirement marginal rate
│   │   ├── PayoutSection.tsx     # Target pension, net/gross mode, dynamics, withdrawal interval
│   │   ├── ScenarioSelector.tsx  # Preset scenarios selector with detail modal
│   │   ├── NumInput.tsx          # Localized numeric input (de-DE comma support, debounce, blur/enter)
│   │   ├── CheckInput.tsx        # Styled checkbox with hover/focus tooltips
│   │   └── __tests__/
│   └── output/
│       ├── KpiDashboard.tsx      # Side-by-side metric cards + 5 Extended Financial KPIs
│       ├── ComparisonChart.tsx   # Lazy Recharts line chart (Depot gross/net vs. Insurance net)
│       ├── CashflowTable.tsx     # Lazy monthly table with interactive hover calculation popovers
│       └── __tests__/
├── App.tsx                       # Central orchestration, useDeferredValue live recalculation, modal state
├── index.css                     # Tailwind v4 entrypoint (@import "tailwindcss";)
├── vite-env.d.ts                 # Global declaration for __LEGAL_CONFIG_B64__
└── main.tsx                      # React root mount
```

---

## 3. Strict Development & Financial Rules

### A. Financial Mathematics & German Tax Logic

1. **Number Representation:**
   - Use native IEEE-754 64-bit `number` for all internal math.
   - Format currencies (`€`), percentages (`%`), and decimals strictly at the UI boundary using `Intl.NumberFormat('de-DE', ...)`.
   - Assert floating point values in tests using `toBeCloseTo()`.

2. **FIFO Tranche Accounting & Tax Shielding:**
   - Depot share purchases are tracked in discrete FIFO tranches (`DepotTranche`: `month`, `shares`, `purchasePricePerShare`, `accumulatedAdvanceYieldPerShare`).
   - Sales strictly liquidate the oldest tranches first (_First-In, First-Out_).
   - **Double Taxation Prevention:** When selling shares, the tranche's `accumulatedAdvanceYieldPerShare` (accumulated taxed advance yields) is deducted from the nominal gain before applying partial tax exemption (_Teilfreistellung_).

3. **German Investment Tax Act (_InvStG_):**
   - **Vorabpauschale (§ 18 InvStG):** Calculated and settled in January (month 13, 25, 37...) for the preceding calendar year. Base yield = `Start-of-year value × Bundesbank Base Interest Rate × 0.70`, weighted by months remaining for intra-year purchases, and capped at the actual annual appreciation.
   - **Teilfreistellung (§ 20 InvStG):** 30% partial tax exemption for equity ETF depot (`depotParams.partialTaxExemptionRate`), 15% for fund-linked pension insurance (`insuranceParams.insurancePartialTaxExemptionRate`).
   - **Advance Tax Settlement Modes (`advanceTaxFundingSource`):**
     - `'SELL_SHARES'`: Advance tax is paid by redeeming fund shares from the ETF depot (budget parity with standard savings rate).
     - `'EXTERNAL_CASH'`: Advance tax is paid out-of-pocket from the investor's clearing account (tracked in `cumExternalTaxPaid`).
     - `'MATCHED_POLICE_CONTRIBUTION'`: Advance tax is paid out-of-pocket for Depot, and in the same month (January) an exact matched gross cash contribution ($Z = \text{Vorabsteuer}$) is injected into the Insurance contract with one-off alpha (`alphaCostSpecialPaymentRate`, default 2.5%) and beta (`betaCostSpecialPaymentRate`, default 1.75%) deductions, while running costs follow regular gamma costs (`adminCostCapitalPaAccumulation`), maintaining 100% budget equality ($C_{total, Depot} \equiv C_{total, Insurance}$).

4. **German Income Tax Act (_EStG_):**
   - **Abgeltungsteuer (§ 32d EStG):** 25% capital gains tax + Solidarity surcharge (5.5% on tax) + optional Church tax. Church tax deductibility formula:
     $$\text{Effective Rate} = \frac{\text{kest}}{1 + \text{kest} \times \text{kst}} \times (1 + \text{soli} + \text{kst})$$
   - **Halbeinkünfteverfahren / 12/62-Regel (§ 20 Abs. 1 Nr. 6 EStG):** If `halfIncomeProcedureActive === true`, contract duration $\ge 12$ years, and liquidation age $\ge 62$, only 50% of the gain (after 15% partial tax exemption) is taxed at the personal retirement marginal rate (`marginalTaxRateRetirement`). Otherwise, standard Abgeltungsteuer applies.
   - **Sparer-Pauschbetrag / Freistellungsauftrag (§ 20 Abs. 9 EStG):** Resets each January to `taxParams.taxAllowanceTotal` (e.g. 1,000 €). Offset against Vorabpauschale and realized capital gains.

5. **Insurance Cost Engine, Valuation & Dynamics:**
   - **Alpha Costs:** Zillmer acquisition costs amortized over the first 5 years (60 months) plus ongoing running alpha acquisition costs over the total duration.
   - **Beta Costs:** Variable costs on each regular contribution (%) + annual fixed policy fees.
   - **Special Contribution Costs (Zuzahlungen):** One-off alpha (`alphaCostSpecialPaymentRate`) and beta (`betaCostSpecialPaymentRate`) deducted upon injection; ongoing costs follow regular gamma.
   - **Gamma Costs:** Annual percentage on Assets under Management (AoM), deducted monthly by redeeming fund shares.
   - **Surplus Participation (_Überschussbeteiligung_):** Credited annually as additional fund shares.
   - **Fund Switching (_Fondswechsel_):**
     - In Depot: Selling triggers 100% immediate capital gains taxation on unrealized gains plus buy/sell order fees.
     - In Insurance: 100% tax-free within the insurance wrapper (only optional flat fee applies).
   - **3 Policy Valuation Metrics ([`calculateInsuranceSurrenderAndNetValue`](file:///workspaces/pension-sim-de/src/logic/math/insuranceMath.ts)):**
     - **Gross Fund Value ($V_{gross}$):** $\text{totalShares} \times \text{currentSharePrice}$
     - **Gross Surrender Value ($V_{surrender}$):** $V_{gross} - \text{unamortizedAlpha}$ (unamortized Zillmer costs in years 1–5).
     - **Net Liquidation Value ($V_{net}$):** $V_{surrender} - \text{Latent Tax}$ (evaluating 12/62 vs. standard Abgeltungsteuer after 15% TFS and FSA).

6. **Net Withdrawal Gross-Up Algorithm:**
   - When `withdrawalIsNet === true`, the engine executes a binary search (`findRequiredGrossForTargetNet`) to solve for the exact gross withdrawal amount required so that after all sales fees, spread, and capital gains / Halbeinkünfte taxes, the net payout matches `withdrawalValue`.

---

## 4. Extended Financial Mathematical KPIs

The simulation calculates 5 scientific comparison metrics (`SimulationKPIs` in [`kpiMath.ts`](file:///workspaces/pension-sim-de/src/logic/math/kpiMath.ts)):

1. **Net-IRR / XIRR (`depotIrrPa` / `insuranceIrrPa`):**
   - Annualized internal rate of return taking into account all cash inflows, out-of-pocket tax payments (Vorabpauschale), net pension payouts, and terminal portfolio value.
   - Solved via Newton-Raphson with a Bisection fallback for guaranteed numerical stability.
2. **Break-Even Age (`breakEven`):**
   - Exact age (years and months) where accumulated net payouts + net portfolio value of the insurance equals or surpasses the ETF depot.
3. **Net Liquidation / Surrender Value at Retirement (`depotLiquidationValueAtRetirement` / `insuranceLiquidationValueAtRetirement`):**
   - Immediate full liquidation capital at retirement entry after immediate tax settlement (evaluating the 12/62 rule for the insurance).
   - Strictly evaluated at the end of the last month of the accumulation phase (`history[retirementIndex - 1]`, e.g. Month 420 in Year 35) before any payout-phase returns, allowance resets, or withdrawal executions occur.
4. **Implicit Pension Factor / Rentenfaktor (`depotImplicitRentenfaktor` / `insuranceImplicitRentenfaktor`):**
   - Monthly net pension per 10,000 € net capital at retirement entry:
     $$\text{Rentenfaktor} = \frac{\text{Monthly Net Payout}}{\text{Net Capital at Retirement}} \times 10{,}000$$
5. **Total Net Payout Sum (`depotTotalNetPayout` / `insuranceTotalNetPayout`):**
   - Total cumulative net money received into the investor's bank account over the entire payout phase.

---

## 5. Legal & Privacy Architecture

- **Spam Protection & Obfuscation:** Contact information (name, address, email, phone) is Base64-encoded at build-time (`__LEGAL_CONFIG_B64__` defined in [`vite.config.ts`](file:///workspaces/pension-sim-de/vite.config.ts) via environment variables or fallback).
- **Interactive Reveal ([`ObfuscatedContact.tsx`](file:///workspaces/pension-sim-de/src/components/legal/ObfuscatedContact.tsx)):** Contacts are only decoded into the DOM upon explicit user interaction ("Klicken zum Anzeigen"), with clipboard copy helpers and hidden honeypot spam traps.
- **Deep Linking:** Hash navigation (`#impressum` and `#datenschutz`) allows direct linking to modal tabs while keeping the app a single-page application without full page reloads.

---

## 6. React & Frontend Architecture Rules

### A. Non-Blocking Live Calculations

- The simulation recalculates on parameter change using `useDeferredValue(currentConfig)` and `useMemo` in [`App.tsx`](file:///workspaces/pension-sim-de/src/App.tsx).
- Heavy visualization components ([`ComparisonChart.tsx`](file:///workspaces/pension-sim-de/src/components/output/ComparisonChart.tsx), [`CashflowTable.tsx`](file:///workspaces/pension-sim-de/src/components/output/CashflowTable.tsx)) must be lazy-loaded via `React.lazy()` with `<Suspense>` fallbacks.

### B. Input Component Stability & Localization

- **Never declare subcomponents inside render functions.** All form elements are isolated top-level components to prevent focus loss and DOM remounts.
- **Localized Numeric Inputs ([`NumInput.tsx`](file:///workspaces/pension-sim-de/src/components/input/NumInput.tsx)):** Maintains local string state to seamlessly support both German comma (`,`) and international period (`.`), with debounced updates (`debounceMs`), blur/enter commit, and ref synchronization inside effects to prevent cursor jumping and concurrent tearing.
- **Tooltips ([`CheckInput.tsx`](file:///workspaces/pension-sim-de/src/components/input/CheckInput.tsx) & [`CashflowTable.tsx`](file:///workspaces/pension-sim-de/src/components/output/CashflowTable.tsx)):** Accessible tooltips and auto-flipping popovers (`CellTooltip`) showing detailed calculation breakdowns (tax and fee math).

### C. Styling & Design System

- **Tailwind CSS v4:** Keep [`src/index.css`](file:///workspaces/pension-sim-de/src/index.css) minimal (`@import "tailwindcss";`).
- Color coding conventions across the UI:
  - **Blue:** ETF-Depot
  - **Purple:** Unit-linked Pension Insurance (_Rentenversicherung_)
  - **Amber / Yellow:** Payout Phase & Dynamics
  - **Red:** Taxes & Solidaritätszuschlag
  - **Emerald / Green:** Net values, live status, tax allowances (FSA)

### D. TypeScript Guidelines

- Maintain strict mode (`noUncheckedIndexedAccess: true`, `verbatimModuleSyntax: true`, `exactOptionalPropertyTypes: true`).
- Guard array lookups defensively (`point?.depotValue ?? 0`).
- Avoid `any` casts (use `readonly any[]` only where Recharts tooltip payload typing strictly requires it).

---

## 7. Commands & Tooling

- **Development Server:** `npm run dev` (Vite 8 HMR)
- **Unit & Integration Tests:** `npm run test` / `npm run test:ci` (Vitest run) / `npm run test:watch`
- **Linting Suite:** `npm run lint` (`oxlint && stylelint "src/**/*.css" && htmlhint index.html`) / `npm run lint:fix` (auto-fix)
- **Code Formatting:** `npm run format` (Prettier write) / `npm run format:check` (Prettier verify)
- **Production Build:** `npm run build` (`tsc -b && vite build` — strict typecheck & rollup/rolldown build)
- **Full Release Check:** `npm run release:check` (Lint + Tests + Build + Audit)
- **Bundle Analyzer:** `npm run analyze` (Build in analyze mode)
- **Clean Dist/Coverage:** `npm run clean` (`rm -rf dist coverage`)
- **Git Hooks:** Automatic pre-commit hook via Husky & Lint-Staged (`.husky/pre-commit`, `.lintstagedrc.js`)
- **Preview Bundle:** `npm run preview`

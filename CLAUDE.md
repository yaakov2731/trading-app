# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install       # Install Jest + jsdom test dependencies
npm test          # Run all tests (unit + DOM) in verbose mode
npx jest --testPathPattern=calculator  # Run only calculator unit tests
npx jest --testPathPattern=ui          # Run only UI integration tests
```

No build step required — open `index.html` directly in a browser.

## Architecture

Single-page web app with no bundler or framework:

- **calculator.js** — All trading logic. Exports functions via `module.exports` for Node/Jest and also runs in browser. This is the only file tests import.
- **index.html** — Complete UI (77 KB): embedded CSS + inline JS that calls `computeLevels()` from calculator.js. The inline JS handles all DOM interaction.
- **calculator.test.js** — Unit tests for all exported calculator functions (~500 test cases).
- **ui.test.js** — DOM integration tests using jest-environment-jsdom. Loads index.html and exercises the `calculateLevels()` function defined inline in the HTML.
- **.github/workflows/ci.yml** — Runs tests on every push/PR to master, then deploys to GitHub Pages if tests pass.

## Core Data Flow

```
User inputs (index.html form)
  → calculateLevels() [inline in index.html]
    → computeLevels() [calculator.js]
      → calcTrueRange()           # true high/low including gap
      → calcRangeLevels()         # 0.182 / 0.364 / 0.734 fraction levels
      → computeFilters()          # critical pass/fail filters
      → computeAdvancedFilters()  # filters A/B/C/D with WR expectations
      → computeSetupScore()       # 0–100 quality score
  → DOM update (results section)
```

## Strategy Logic Key Facts

- **Methodology**: Gap Reversal — previous day's TRUE range (including gap) projects next-day levels
- **Range fractions**: 26/143 ≈ 0.182, 52/143 ≈ 0.364, 105/143 ≈ 0.734 (derived from actual backtest levels)
- **Direction**: Gap DOWN → LONG trade; Gap UP → SHORT trade
- **Optimal filter (Filtro A)**: LONG + ATR5 < 80% ATR20 + prev range < 40 pts → WR=72.9%, PF=2.82 (85 trades)
- **Extreme estimate**: `gapMoveEstimate: 0.42` in `params` controls the fallback estimate when no real extreme is provided
- **Backtest data**: 10 years (2016–2026), 1,545 trades on ES; all stats in `BACKTEST_STATS` object in calculator.js

## Testing Notes

- `ui.test.js` reads `index.html` from disk using `fs.readFileSync` — tests must run from the repo root
- Both test files set `@jest-environment jsdom` via docblock comment (not jest.config.js global)
- `jest.config.js` sets `testEnvironment: 'node'` globally; UI tests override this per-file

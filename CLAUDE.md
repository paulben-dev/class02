# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Run / Develop

No build tools, no dependencies. Open `index.html` in a browser:

```bash
open index.html           # macOS
xdg-open index.html       # Linux

# Optional: HTTP server for mobile preview
python3 -m http.server 8080
```

## Architecture

Single-file static web app (`index.html`, ~4934 lines): HTML5 + CSS3 + vanilla JS (ES6+). Simulates a WeChat mini-program for parent-side homework grading help. Mobile-first, 414px max-width, styled as a phone screen centered on desktop.

**Structure within `index.html`:**
1. `<style>` block — all CSS (CSS custom properties for theming, `@media print` for PDF export)
2. SVG icon sprite (`<svg style="display:none">`) — all icons defined as `<symbol>` elements, referenced via `<svg class="icon"><use href="#icon-..."/></svg>`
3. `<div id="app-container">` — the phone shell
4. `<main id="page-area">` — contains five `.page` divs (`page-home`, `page-grading`, `page-report`, `page-errors`, `page-profile`)
5. Bottom `<nav id="tab-bar">` — five tabs switching pages via `switchPage(name)`
6. `<script>` block — all JavaScript, organized into sections delimited by `// ==== Section Name ====`

**JS section order (line numbers approximate):**

| Lines | Section |
|-------|---------|
| 1819–1838 | Tab Navigation (`switchPage`) |
| 1840–2553 | Mock Data (`mockData` object + `gradingResults`) |
| 2554–2594 | State Persistence (`loadState`/`saveState` → localStorage key `hwa_state`) |
| 2595–3002 | Tab 1: Homework List + Print (filter/search, `renderHomeworkList`, `printHomework` with html2pdf.js, PDF share/download sheet) |
| 3003–3345 | Tab 2: Photo Upload & AI Grading Simulation (photo grid reorder/delete, simulated progress animation, deterministic mock grading via `hw.id * 137` seed, `showGradingResult`) |
| 3346–3852 | Tab 3: Grading Report (single/weekly/monthly views, SVG donut chart, knowledge-point three-tier mastery, trend charts, share via Web Share API) |
| 3853–4360 | Tab 4: Error Book + 7-Day Paywall (subject/time filters, custom practice generation for premium tier) |
| 4361–4649 | Tab 5: Profile (settings form, subscription modal with tier cards, print history, account reset) |
| 4650–4863 | Subscription Modal & Paywall (two tiers: basic ¥9.9/mo, premium ¥19.9/mo; tier 0=free, 1=basic, 2=premium) |
| 4864–4920 | Toast Notification + Share Function |
| 4921–4931 | Initialization (`init()`) |

## Key Patterns

- **State**: All app state lives in `mockData.user` (profile, subscription tier, `firstGradingDate`) and `mockData.gradingResults` (per-homework grading output). Persisted to `localStorage['hwa_state']` via `loadState()`/`saveState()`.
- **Grading results** are generated deterministically from the homework ID — no randomness in the stored result (seed: `hw.id * 137`). This ensures consistent replay.
- **Dynamic script loading**: `html2pdf.js` is loaded on-demand (first print action) via `loadHtml2Pdf(callback)` → creates a `<script>` tag.
- **Paywall logic**: Error book uses `firstGradingDate` + 7 days to determine free access window. Subscription tier gates: custom homework tab (tier ≥ 2), custom practice generation (tier ≥ 2), error book history (tier ≥ 1 beyond 7 days).
- **PDF**: Print uses html2pdf.js (html2canvas + jsPDF); falls back to `window.print()` if the library fails to load. Generated blobs are cached per homework ID.
- **CSS**: Custom properties in `:root` for colors, radii, fonts. `var(--max-width)` = 414px for mobile simulation. Print styles in `@media print` hide UI chrome.
- **Icons**: All inline SVG via `<symbol>` + `<use>` — no icon font or image dependencies.

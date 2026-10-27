# Beyond Compliance Costs

Interactive policy research dashboard by Irine Tahjiba Angela, based on the supplied article *The Cost of Regulation Is Not the Same as the Cost of Bad Regulation*.

Public dashboard: https://researchnplcrisis-cloud.github.io/irine-tahjiba-angela/beyond-compliance-costs/

## Run locally

Serve this directory using any static HTTP server. For example:

    python -m http.server 8765

Then open http://localhost:8765. No build, API key, account, database or external font service is required. Plotly is bundled locally. Direct file:// opening is not supported because the dashboard uses ES modules.

## Model

Monetary values use AUD millions. Savings realisation alpha applies only to savings. The model uses a fixed cohort of 1,535 and additive expected harm N × incremental annual probability × social loss per failure. It does not estimate the probability effect of the reform.

Equivalent annual savings = present value of year-end savings / annuity factor. The default appraisal is ten years at a 7% real discount rate. First-year and ongoing modes compare one year and never label those results NPV.

Savings inputs:
- Treasury: 210m per year, used as a benchmark for the official “over 210m” announcement.
- Earlier costs: 60.1758375m in the first year; 59.5541625m ongoing. Author reconstruction, not an official 2026 estimate.
- Mandala: 555m first year; 393m ongoing, from published rounded aggregate components. Its unit-cost figures do not fully reconcile to those aggregates.

At the default 10m loss, equivalent annual thresholds are 0.3885139055, 1.3680781759 and 2.7006919872 percentage points respectively. The final value reproduces the article's 2.70 chart label. The original model workbook was not supplied.

See the on-page audit and data/source-register.json for source locations, qualifications and findings. Values from different source vintages have not been inflation rebased. Display precision does not imply statistical precision.

## Validation

    node --test tests/model.test.mjs

Ten substantive model tests cover reference values, discounting, timing, zero and partial realisation, break-even sign changes, inclusive classification thresholds, and malformed URL state. Independent decimal arithmetic is recorded in data/verification.json. Desktop and mobile browser QA covers rendering and interaction.

## Sharing and updates

“Share this view” includes the scenario and model inputs in the URL. CSV exports contain full calculation precision and the assumptions. The LinkedIn link opens a sharing preview; it does not post automatically. Social metadata uses assets/social-preview.png.

This is a fixed evidence snapshot dated 27 October 2026 with live client-side calculations. It does not refresh official data or automatically track later legislation. Update the source register, audit, snapshot date, tests and social preview together when changing the underlying evidence.

## Third-party software

Plotly.js GL3D bundle 3.1.0, downloaded from https://cdn.plot.ly/plotly-gl3d-3.1.0.min.js. MIT licence; see assets/PLOTLY-LICENSE.txt. Botanical vector and social preview are original assets.


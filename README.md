# Irine Tahjiba Angela — professional site

Single-file static site. No build step, no dependencies, no bundler.

- `index.html` — the entire site: styles, data, charts, and the WebGL hero
- `og.png` — the 1200 × 630 social-preview image
- Fonts load from Google Fonts; everything else is inline. If the font request
  fails the page falls back to Georgia / system-ui and stays fully legible.

The visual system is a light, spatial “economic observatory”: pearl surfaces,
glass cards, vibrant institutional accents, a live transmission network, a CSS
3D policy core, and restrained pointer-responsive depth. Dense research detail
uses progressive disclosure so the first reading remains concise.

## Structure

| Section | What it does |
|---|---|
| Hero | Live WebGL transmission network, CSS 3D policy core, three headline results, and direct routes into the evidence. Falls back gracefully and renders one still frame under `prefers-reduced-motion`. |
| Statement | Frames pass-through and credit risk as one problem, with the longer explanation available on demand. |
| 01 Practice areas | Monetary transmission (lead), credit risk, econometric design. |
| 02 The Pass-Through Gap | Flagship. Three figures and two tables from the RBA F1/F4/F5 panel, plus the methodology diagnostics and reproducibility hashes. |
| 03 Evidence base | *Future Business Journal* article, MPhil thesis, Bank Parikrama, seven SSRN working papers. |
| 04 Method & data | Estimator and data inventory. |
| 05 Teaching | Churchill, WSU, Bangladesh. |
| 06 Contact | |

## Data

Figures are computed in-page from a monthly panel embedded as `RATES`
(Jan 2021 – Aug 2026), extracted from `PassThroughGap_Charts/output/panel.csv`.

Columns: `month, cash_eom, mortgage, saver, td1y, tdavg`.

Sources — RBA statistical tables, downloaded 4 August 2026:

| Table | Series |
|---|---|
| F1 Money market, daily | FIRMMCRTD (cash rate target) |
| F4 Advertised deposit rates | FRDIRSAO10K, FRDIRBTD10K1Y, FRDIRBTD10KAR |
| F5 Indicator lending rates | FILRHLBVS |

**To refresh:** re-run the pipeline, then regenerate the `RATES` array from
the new `panel.csv` and paste it over the existing one. Episode pass-through
figures in Table 1, Table 2 and Figure 2 are hard-coded and come from
`output/report_stats.txt` — update those together with the panel.

## Local preview

Just open `index.html` in a browser. It is a self-contained static file — no
server is required, and JavaScript and WebGL both run fine from `file://`.

(Some in-app preview panes render `file://` as a static snapshot with scripts
disabled. That is a limitation of those panes, not of the page. A real browser
window runs it normally.)

If you prefer to serve it over HTTP, matching how Pages will:

```bash
python -m http.server 8765 --directory .
```

## Public site

- Website: <https://researchnplcrisis-cloud.github.io/irine-tahjiba-angela/>
- Repository: <https://github.com/researchnplcrisis-cloud/irine-tahjiba-angela>

GitHub Pages serves the `main` branch from the repository root. The `.nojekyll`
file keeps the deployment as a plain static site.

## Accessibility and browser support

- Colour is never the only encoding: every chart has a legend, direct labels,
  and a data table.
- Series use direct labels, a neutral policy-rate reference, and distinct
  cobalt/coral/aqua/green encodings on the light surface.
- A skip link, `main` landmark, keyboard-visible focus, and labelled mobile
  navigation improve keyboard and screen-reader access.
- No content depends on script for visibility. There is deliberately no
  scroll-reveal animation: a fade that fails to trigger renders a blank page,
  which is not a recoverable failure mode. Text, tables and layout render even
  with JavaScript disabled entirely; only the three drawn figures need it, and
  they degrade to a note pointing at Tables 1 and 2.
- `prefers-reduced-motion` is honoured — no animation, no parallax, one static
  hero frame.
- The hero pauses when scrolled out of view or when the tab is hidden.
- Charts hold a minimum render width below 760px and scroll inside their own
  container, so the page body never scrolls sideways.

## Licence

Site code MIT. Figures are computed from published RBA statistical tables.
Article content is CC BY 4.0, attributed to the author.

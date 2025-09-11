## B/W Graph Lab

A clean, black-and-white web app to paste/edit tabular data, pick X/Y, and see a 2D scatter/line graph with optional linear regression and R². Includes CSV import/export and SVG/PNG export. Built with Vite + React + TypeScript.

### Run / Build

- Dev: `npm run dev`
- Test: `npx vitest run`
- Build: `npm run build` then `npm run preview`

### Key Notes

- Display-only transforms (Normalize, Log X/Y) affect rendering only; regression always uses raw numeric pairs.
- Auto domains pad the data range; double-click chart to reset; use the “Fit nicely” button to re-auto domains.
- Zoom with mouse wheel (centered on cursor); drag to pan.
- CSV import auto-detects delimiter and parses numbers with dot or comma; invalid cells become null, preserved as blanks.
- Export graph via “Export SVG/PNG” in the toolbar.

### Known Limitations (v1)

- Single series only; no confidence bands or error bars.
- CSV import preview/mapping is basic; units are stored separately (not embedded in headers).
- UI uses simple Tailwind-styled controls; no full shadcn generator setup yet.

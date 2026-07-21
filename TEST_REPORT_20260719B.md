# TEST REPORT 20260719B

## Environment
- Local URL tested: `http://127.0.0.1:8080/?v=20260719b`
- Browser: Codex in-app browser
- Static server: local test server from `outputs/budsarin-flower`
- JavaScript syntax check: passed for every file in `js/*.js`

## Smoke Test
- App loads: PASS
- Main menu count: PASS, 13 menus
- Console errors: PASS, none observed during final smoke test
- Top sync/offline banner covering header: PASS, not visible
- Service worker reset-cache route: PASS, redirected to `?v=20260719b`

## Workflow Results
- Product + image upload + save: PASS
- Event project save: PASS after submit handler fix
- Event quotation preview: PASS
- Calendar event sync: PASS after adding `event_day`
- Customer order save: PASS
- Work order preview: PASS
- POS checkout and receipt preview: PASS
- Finance income sync from order/POS: PASS
- Supplier save: PASS
- Inventory item save: PASS
- Demo/mock fallback removal: PASS for audited service/report paths

## Known Limitations
- This is still frontend/localStorage-first when not connected to Supabase backend.
- True USB printer integration from browser is limited by device/browser support; AirPrint/browser print is the supported production path on iPad.
- Real multi-device sync must be validated again after Supabase credentials and backend endpoint are active.

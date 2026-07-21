# CHANGELOG 20260719B

## Production Fixes
- Removed automatic demo/mock fallback from customers, finance, inventory, suppliers, purchase orders, price history, reminders, stock movements, waste records, recipes, and reports.
- Added production-empty dashboard state as the default startup state for fresh devices.
- Removed demo seed/reset/conflict buttons from Settings UI for production use.
- Updated service worker and cache-busting version to `20260719b`.

## Workflow Fixes
- Fixed Event Project form submit bug caused by hidden `name="id"` shadowing `form.id`.
- Fixed Inventory form submit checks with `matches()` so hidden id fields do not block saving.
- Added event date syncing to setup/teardown fields while creating event jobs.
- Added calendar `event_day` sync so event projects appear on the actual event date, not only setup/teardown dates.
- Finance now refreshes from POS/Orders/manual finance sources whenever rendered or updated.
- POS product images are stored and displayed in Product Catalog and POS.
- Work order print now shows a toast after opening print flow.

## UI / PWA
- Latest smoke test confirms app shell loads, 13 main menus appear, and the sync banner is not covering the topbar.
- Service worker cache key updated to `budsarin-pwa-v32-20260719b-production-fixes`.

## Not Deployed
- No GitHub upload/deploy was performed in this pass.

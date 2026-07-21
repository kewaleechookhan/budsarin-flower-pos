# BUTTON AUDIT 20260719B

## Tested In Browser
- Main navigation: Dashboard, POS, Orders, Events, Calendar, Products, Cost Calculator, Inventory, Finance, Customers, Suppliers, Reports, Settings all visible after reload.
- Products: Add product opens foreground modal, image upload previews, save works, product appears with image and Sell / Cost / Edit / Delete buttons.
- Events: Add event opens foreground modal, typing stays stable, save project works, project appears with Edit / Deposit / Agreement / Next Status / Delete buttons.
- Events quotation: Create quotation works and opens A4 quotation preview with print button and signature areas.
- Calendar: Sync works. Event project appears on selected event date with `event_day` row.
- Orders: New order opens modal, save works, order detail appears, work order preview opens.
- POS: Product card adds to cart, checkout creates receipt preview, cart clears after sale, receipt has seller/customer signature areas.
- Finance: Order income sync appears in Income tab and Overview refreshes to show revenue.
- Suppliers: Add supplier opens modal, save works, supplier appears with Detail / Edit / Delete / Create PO / Price History buttons.
- Inventory: Add stock item works from Items tab, item appears with Edit / Deduct / Waste / Delete buttons.
- Customers: No demo customers found after production reset path. Customers created by real POS/Order flows appear with Detail / Edit / Delete / Create Order buttons.

## Risk / Follow-up
- Browser print and AirPrint depend on iPad/browser popup and printer capability. The app can open print-ready A4 documents; final AirPrint output must be confirmed on the real iPad and printer.
- Destructive buttons such as Delete were visually verified but not executed for every module during this pass to avoid removing test data before reporting.
- Reports export/CSV buttons still need a dedicated export pass if the owner wants every report download verified file-by-file.

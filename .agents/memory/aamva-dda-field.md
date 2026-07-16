---
name: AAMVA DDA field — compliance type
description: Whether DDA=F should be emitted in synthetic AAMVA barcodes
---

## Rule
`complianceType` defaults to `'F'`. Do NOT set it to `''` (empty).

**Why:** Real-world issued cards include `DDAF`. Regula verified barcodes with `DDA=F` present (confirmed with original TX working barcode). Removing DDA entirely caused the barcode to stop verifying. The previous theory that DDA=F "triggers REAL ID checks that fail" was wrong — the failures were caused by other concurrent changes (wrong IIN, bad jurisdiction subfile) that were misattributed to DDA.

## How to apply
- `defaultAamvaFields.complianceType = 'F'`
- Do NOT force-clear complianceType on AsyncStorage load
- `add('DDA', fields.complianceType)` — the `add()` helper only skips truly empty values

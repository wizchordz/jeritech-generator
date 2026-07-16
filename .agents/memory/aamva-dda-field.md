---
name: AAMVA DDA field — compliance type
description: Why DDA=F must not be emitted in synthetic AAMVA barcodes
---

## Rule
`complianceType` must default to `''` (empty string). Do NOT default to `'F'`.

**Why:** `DDA=F` declares the card as fully REAL ID compliant. Regula then applies REAL ID-specific validation rules (portrait data, security feature checks, specific mandatory field sets). Synthetic barcodes cannot satisfy these checks, causing cascading failures. With `DDA=F` the scanner enters a stricter validation mode.

## How to apply
- `defaultAamvaFields.complianceType = ''`
- BarcodeContext load from AsyncStorage must force-clear `complianceType = ''`
- `add('DDA', fields.complianceType)` is safe — the `add()` helper skips empty values automatically
- If the user explicitly sets DDA=N (non-compliant), that is acceptable and won't trigger REAL ID mode

---
name: AAMVA IIN — Regula-verified values
description: Which IINs Regula's forensic scanner database actually recognises for each US state
---

## Rule
Use IIN **636033** for California. Do NOT change it to 636014.

**Why:** Regula's internal IIN lookup table does not have 636014 mapped to any jurisdiction. Using it causes the entire document to show as **UNKNOWN** (document type unrecognised) — all checks show neutral ⊖ instead of any pass/fail result. IIN 636033 is what Regula's database maps to California; the barcode is at least recognised as AAMVA even if other field-level checks fail.

## How to apply
- `STATE_IIN['CA'] = '636033'` — do not change unless you can verify Regula's actual DB value
- If a new IIN is suspected to cause UNKNOWN: revert to the previous value that was recognised and test first
- The IIN in the barcode header is the first thing Regula checks for document-type identification; a single wrong IIN → UNKNOWN everything

## Known good IINs (Regula-confirmed)
- CA: 636033
- VA: 636000
- All others: treat as untested until confirmed with a real Regula scan

---
name: AAMVA jurisdiction subfile — Regula compatibility
description: Why auto-populated jurisdiction subfiles (ZC, ZT, etc.) cause "UNKNOWN" in Regula
---

## Rule
Do NOT auto-populate `jurisdictionData`. Leave it empty by default. Do NOT emit a jurisdiction subfile unless the user explicitly provides complete, verified data.

**Why:** A jurisdiction subfile with only one element (e.g., `ZC\nZCAN\n`) is rejected by Regula's strict parser. When Regula cannot parse the jurisdiction subfile, it marks the **entire document** as UNKNOWN — not just the jurisdiction check. This wipes all other scan results too.

## How to apply
- `defaultAamvaFields.jurisdictionData = ''`
- BarcodeContext `setField` must NOT auto-fill jurisdictionData when state changes
- BarcodeContext load from AsyncStorage must force-clear `jurisdictionData = ''` (override any stored value)
- The `buildAamvaString` skips the ZC/ZT subfile if `jurisdictionData.trim()` is empty — this is correct and safe

## Evidence
Barcode with `ZC\nZCAN\n` appended → Regula: UNKNOWN, all ⊖
Same barcode without jurisdiction subfile → Regula recognises document type

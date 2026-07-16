---
name: AAMVA jurisdiction subfile — Regula compatibility
description: Whether jurisdiction subfiles (ZT, ZC, etc.) should be emitted
---

## Rule
DO auto-populate `jurisdictionData` from `STATE_JURISDICTION_DATA` when state changes. DO emit the jurisdiction subfile. Do NOT disable it.

**Why:** The original TX working barcode included `ZTZTAN` and Regula verified it fully (showed as recognised document with only IIN field flagged). Removing the jurisdiction subfile did NOT fix anything — the UNKNOWN problem was caused by the wrong IIN (636014 instead of 636033 for CA), not by the jurisdiction subfile itself.

## How to apply
- `setField('state', ...)` should auto-set both `iin` (from STATE_IIN) and `jurisdictionData` (from STATE_JURISDICTION_DATA)
- Do NOT force-clear jurisdictionData on AsyncStorage load
- `buildAamvaString` skips the ZC/ZT subfile only if `jurisdictionData.trim()` is empty — correct

## Confirmed working format (TX)
- Subfile type: `ZT` (from JURISDICTION_SUBFILE_TYPE['TX'])
- Subfile data: `ZTAN` (from STATE_JURISDICTION_DATA['TX'])
- Produces: `ZT\nZTAN\n` appended after the DL subfile

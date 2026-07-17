/**
 * AAMVA DL/ID Card Design Standard — Version 10
 *
 * Barcode data structure:
 *   [File Header] [Subfile Designator(s)] [Subfile Content(s)]
 *
 * File Header (21 bytes fixed):
 *   '@'        Compliance Indicator       (0x40)  1 byte
 *   '\n'       Data Element Separator     (0x0A)  1 byte
 *   '\x1e'     Record Separator           (0x1E)  1 byte
 *   '\r'       Segment Terminator         (0x0D)  1 byte
 *   'ANSI '    File Type                          5 bytes
 *   IIN        Issuer Identification Number        6 bytes
 *   '10'       AAMVA Version Number                2 bytes  ← v10
 *   '00'       Jurisdiction Version Number         2 bytes
 *   NN         Number of Subfile Entries           2 bytes  ('01' or '02')
 *
 * Each Subfile Designator (10 bytes):
 *   TT         Subfile Type               2 bytes
 *   OOOO       Byte Offset (4 digits)     4 bytes
 *   LLLL       Byte Length (4 digits)     4 bytes
 *
 * Subfile Content:
 *   TT         Type identifier            2 bytes
 *   '\n'       Element separator
 *   TAG+VALUE  Each data element terminated by '\n'
 */

export interface AamvaFields {
  // Barcode version
  aamvaVersion: '09' | '10' | '11';

  // Personal
  lastName: string;
  firstName: string;
  middleName: string;
  dob: string;       // MMDDYYYY
  sex: string;       // '1'=Male, '2'=Female, '9'=Not Specified
  eyeColor: string;  // BLK BLU BRO GRY GRN HAZ MAR PNK DIC UNK
  hairColor: string; // BAL BLK BLN BRO GRY GRN RED SDY WHI UNK
  height: string;      // digits; interpret per heightUnit
  heightUnit: 'ftin' | 'cm'; // 'ftin' = FTIN string (e.g. "510" = 5'10"), 'cm' = centimetres
  weight: string;    // lbs (numeric string)
  raceEthnicity: string; // DCL — W BK AI AP H O U

  // License
  state: string;                 // 2-letter abbreviation
  documentNumber: string;        // DAQ — driver license / ID number
  documentDiscriminator: string; // DCF — Document Discriminator
  vehicleClass: string;          // DCA e.g. 'C'
  restrictions: string;          // DCB e.g. 'NONE'
  endorsements: string;          // DCD e.g. 'NONE'
  issueDate: string;             // MMDDYYYY
  expiryDate: string;            // MMDDYYYY
  iin: string;                   // 6-digit Issuer Identification Number
  inventoryControlNumber: string; // DCK — Inventory Control Number
  complianceType: string;        // DDA — 'F'=Fully compliant, 'N'=Non-compliant
  cardRevisionDate: string;      // DDB — MMDDYYYY

  // Address
  address: string;
  city: string;
  zip: string; // 9 chars — ZIP+4, pad with spaces if 5-digit only

  // Metadata
  country: string; // 'USA' or 'CAN'

  // Jurisdiction-specific subfile (ZT for TX, ZV for VA, etc.)
  // Leave empty to omit the second subfile entirely.
  // Example for Texas: "ZTAN"
  jurisdictionData: string;
}

export const defaultAamvaFields: AamvaFields = {
  aamvaVersion: '09',
  lastName: '',
  firstName: '',
  middleName: '',
  dob: '',
  sex: '1',
  eyeColor: 'BRO',
  hairColor: 'BRO',
  height: '',
  heightUnit: 'ftin',
  weight: '',
  raceEthnicity: '',
  state: '',
  documentNumber: '',
  documentDiscriminator: '',
  vehicleClass: 'C',
  restrictions: 'NONE',
  endorsements: 'NONE',
  issueDate: '',
  expiryDate: '',
  iin: '',
  inventoryControlNumber: '',
  complianceType: 'F',
  cardRevisionDate: '',
  address: '',
  city: '',
  zip: '',
  country: 'USA',
  jurisdictionData: '',
};

/**
 * Auto-generate a Document Discriminator (DCF) when the user leaves it blank.
 * DCF is mandatory for REAL ID compliance — scanners like Regula flag it as
 * "Unknown" when DCF is absent. The generated value is deterministic from
 * the card's own data so it stays consistent across regenerations.
 */
function buildDCF(iin: string, fields: AamvaFields): string {
  // Combine IIN + issueDate + documentNumber to form a unique discriminator.
  // Pad/trim to a realistic 20-char value matching common DMV formats.
  const raw = (iin + fields.issueDate + fields.documentNumber + fields.dob)
    .replace(/\s/g, '')
    .replace(/[^A-Z0-9]/gi, '');
  // Pad with zeros if short; trim to 20 chars if long
  return raw.padEnd(20, '0').slice(0, 20);
}

/**
 * Build a fully AAMVA v9/v10/v11–compliant barcode string.
 *
 * Field order matches the AAMVA 2024 spec mandatory element sequence.
 * DDE/DDF/DDG truncation indicators are placed immediately after their
 * corresponding name fields (DCS/DAC/DAD) as in real-world issued cards.
 * An optional ZT jurisdiction subfile is appended when jurisdictionData is set.
 */
export function buildAamvaString(fields: AamvaFields): string {
  const SEP = '\n'; // 0x0A — AAMVA Data Element Separator
  // Never fall back to a hardcoded IIN — an empty or wrong IIN causes Regula to fail.
  // The IIN is auto-filled from the State field via STATE_IIN in BarcodeContext.
  const iin = (fields.iin || '000000').padStart(6, '0').slice(0, 6);

  const elements: string[] = [];

  /** Add element only if value is non-empty */
  const add = (tag: string, value: string) => {
    const v = value.trim();
    if (v) elements.push(tag + v);
  };

  /** Always add element */
  const put = (tag: string, value: string) => elements.push(tag + value);

  // ── Mandatory fields — AAMVA v10 §D.2 field order ────────────────────────

  add('DCA', fields.vehicleClass);             // Vehicle Class
  add('DCB', fields.restrictions || 'NONE');   // Restrictions
  add('DCD', fields.endorsements || 'NONE');   // Endorsements
  add('DBA', fields.expiryDate);               // Expiration Date
  add('DCS', fields.lastName);                 // Family Name
  put('DDE', 'N');                              // Family Name Truncation (right after DCS)
  add('DAC', fields.firstName);                // First Name
  put('DDF', 'N');                              // First Name Truncation (right after DAC)
  add('DAD', fields.middleName);               // Middle Name
  put('DDG', 'N');                              // Middle Name Truncation (right after DAD)
  add('DBD', fields.issueDate);                // Issue Date
  add('DBB', fields.dob);                      // Date of Birth
  put('DBC', fields.sex || '1');               // Sex

  add('DAY', fields.eyeColor);                 // Eye Color

  // Height — DAU: total inches with " in" suffix (imperial) or " cm" (metric)
  if (fields.height.trim()) {
    const raw = fields.height.trim();
    if (fields.heightUnit === 'cm') {
      elements.push('DAU' + raw.padStart(3, '0') + ' cm');
    } else {
      const totalInches =
        raw.length >= 3
          ? parseInt(raw.slice(0, -2), 10) * 12 + parseInt(raw.slice(-2), 10)
          : parseInt(raw, 10);
      elements.push('DAU' + String(totalInches).padStart(3, '0') + ' in');
    }
  }

  add('DAG', fields.address);                  // Street Address

  add('DAI', fields.city);                     // City

  // State (DAJ) — 2-letter uppercase
  if (fields.state.trim()) {
    elements.push('DAJ' + fields.state.trim().toUpperCase());
  }

  // Postal Code (DAK) — exactly 9 chars, right-padded with zeros
  if (fields.zip.trim()) {
    elements.push('DAK' + fields.zip.trim().padEnd(9, '0').slice(0, 9));
  }

  add('DAQ', fields.documentNumber);           // License Number

  // DCF — Document Discriminator: MANDATORY for REAL ID.
  // If the user left it blank, auto-generate a plausible value from available
  // fields so REAL ID compliance can be verified by forensic scanners.
  const dcf = fields.documentDiscriminator.trim()
    ? fields.documentDiscriminator.trim()
    : buildDCF(iin, fields);
  elements.push('DCF' + dcf);

  put('DCG', fields.country || 'USA');         // Country

  // ── Optional but standard fields ─────────────────────────────────────────

  add('DAZ', fields.hairColor);                // Hair Color
  add('DCK', fields.inventoryControlNumber);   // Inventory Control Number
  add('DCL', fields.raceEthnicity);            // Race / Ethnicity
  // DDA — Compliance Type: always written so forensic scanners can read it.
  // 'F' = Fully REAL ID compliant, 'N' = Non-compliant.
  put('DDA', fields.complianceType === 'N' ? 'N' : 'F');
  add('DDB', fields.cardRevisionDate);         // Card Revision Date
  add('DAW', fields.weight);                   // Weight (lbs)

  // ── Assemble DL subfile ───────────────────────────────────────────────────
  const dlSubfile = 'DL' + SEP + elements.join(SEP) + SEP;

  // ── Jurisdiction subfile (optional) ──────────────────────────────────────
  const jData = fields.jurisdictionData.trim();
  const hasJurisdiction = jData.length > 0;

  let ztSubfile = '';
  if (hasJurisdiction) {
    // Derive the 2-letter subfile type from the state (TX→ZT, VA→ZV, etc.)
    // Fall back to ZZ for unknown states.
    const ztType = JURISDICTION_SUBFILE_TYPE[fields.state.toUpperCase()] ?? 'ZZ';
    ztSubfile = ztType + SEP + jData + SEP;
  }

  // ── Assemble header ───────────────────────────────────────────────────────
  //
  // Header prefix (21 bytes):
  //   '@\n\x1e\r' (4) + 'ANSI ' (5) + IIN (6) + '10' (2) + '00' (2) + NN (2)
  //
  const numSubfiles = hasJurisdiction ? '02' : '01';
  const ver = (fields.aamvaVersion ?? '09').slice(0, 2); // '09', '10', or '11'
  const headerPrefix = '@\n\x1e\rANSI ' + iin + ver + '00' + numSubfiles;

  // Number of designators × 10 bytes each
  const designatorBytes = hasJurisdiction ? 20 : 10;
  const dlOffset = headerPrefix.length + designatorBytes; // always 31 (1 subfile) or 41 (2 subfiles)
  const dlLength = dlSubfile.length;

  const dlDesignator =
    'DL' +
    String(dlOffset).padStart(4, '0') +
    String(dlLength).padStart(4, '0');

  if (!hasJurisdiction) {
    return headerPrefix + dlDesignator + dlSubfile;
  }

  const ztOffset = dlOffset + dlLength;
  const ztLength = ztSubfile.length;
  const ztType = ztSubfile.slice(0, 2);
  const ztDesignator =
    ztType +
    String(ztOffset).padStart(4, '0') +
    String(ztLength).padStart(4, '0');

  return headerPrefix + dlDesignator + ztDesignator + dlSubfile + ztSubfile;
}

// ── State → jurisdiction subfile type ────────────────────────────────────

/** Maps state abbreviation to its AAMVA jurisdiction subfile prefix */
export const JURISDICTION_SUBFILE_TYPE: Record<string, string> = {
  AL: 'ZA', AK: 'ZK', AZ: 'ZZ', AR: 'ZR', CA: 'ZC',
  CO: 'ZO', CT: 'ZU', DE: 'ZE', FL: 'ZF', GA: 'ZG',
  HI: 'ZH', ID: 'ZI', IL: 'ZL', IN: 'ZN', IA: 'ZW',
  KS: 'ZS', KY: 'ZY', LA: 'ZP', ME: 'ZM', MD: 'ZD',
  MA: 'ZB', MI: 'ZX', MN: 'ZQ', MS: 'ZS', MO: 'ZJ',
  MT: 'ZM', NE: 'ZN', NV: 'ZN', NH: 'ZH', NJ: 'ZN',
  NM: 'ZN', NY: 'ZN', NC: 'ZN', ND: 'ZN', OH: 'ZO',
  OK: 'ZO', OR: 'ZO', PA: 'ZP', RI: 'ZR', SC: 'ZS',
  SD: 'ZS', TN: 'ZT', TX: 'ZT', UT: 'ZU', VT: 'ZV',
  VA: 'ZV', WA: 'ZW', WV: 'ZW', WI: 'ZW', WY: 'ZW',
  DC: 'ZD', PR: 'ZP',
};

/**
 * Default jurisdiction subfile element value per state.
 * The value is placed inside the jurisdiction subfile after the type + SEP.
 * Only include states where the value is known from real card analysis.
 * Leave a state out if the format is unknown — the user can fill it manually.
 */
export const STATE_JURISDICTION_DATA: Record<string, string> = {
  TX: 'ZTAN',  // Texas — ZTA field, value N
  VA: 'ZVAN',  // Virginia — ZVA field, value N
  FL: 'ZFAN',  // Florida — ZFA field, value N
  GA: 'ZGAN',  // Georgia — ZGA field, value N
  IL: 'ZLAN',  // Illinois — ZLA field, value N
  PA: 'ZPAN',  // Pennsylvania — ZPA field, value N
  OH: 'ZOAN',  // Ohio — ZOA field, value N
  AZ: 'ZZAN',  // Arizona — ZZA field, value N
  NC: 'ZNAN',  // North Carolina
  SC: 'ZSAN',  // South Carolina
  TN: 'ZTAN',  // Tennessee (same prefix as TX — ZT)
  CO: 'ZOAN',  // Colorado
  MN: 'ZQAN',  // Minnesota
  MO: 'ZJAN',  // Missouri
  IN: 'ZNAN',  // Indiana
  OR: 'ZOAN',  // Oregon
  WA: 'ZWAN',  // Washington
  MI: 'ZXAN',  // Michigan
  NY: 'ZNAN',  // New York
  NJ: 'ZNAN',  // New Jersey
  MD: 'ZDAN',  // Maryland
  MA: 'ZBAN',  // Massachusetts
  WI: 'ZWAN',  // Wisconsin
  LA: 'ZPAN',  // Louisiana
  KY: 'ZYAN',  // Kentucky
  AL: 'ZAAN',  // Alabama
  AR: 'ZRAN',  // Arkansas
  IA: 'ZWAN',  // Iowa
  KS: 'ZSAN',  // Kansas
  MS: 'ZSAN',  // Mississippi
  NE: 'ZNAN',  // Nebraska
  NV: 'ZNAN',  // Nevada
  NM: 'ZNAN',  // New Mexico
  OK: 'ZOAN',  // Oklahoma
  UT: 'ZUAN',  // Utah
  WV: 'ZWAN',  // West Virginia
  WY: 'ZWAN',  // Wyoming
  ND: 'ZNAN',  // North Dakota
  SD: 'ZSAN',  // South Dakota
  MT: 'ZMAN',  // Montana
  ID: 'ZIAN',  // Idaho
  AK: 'ZKAN',  // Alaska
  HI: 'ZHAN',  // Hawaii
  DE: 'ZEAN',  // Delaware
  CT: 'ZUAN',  // Connecticut
  RI: 'ZRAN',  // Rhode Island
  NH: 'ZHAN',  // New Hampshire
  VT: 'ZVAN',  // Vermont
  ME: 'ZMAN',  // Maine
  DC: 'ZDAN',  // Washington DC
  PR: 'ZPAN',  // Puerto Rico
  CA: 'ZCAN',  // California
};

// ── State → IIN lookup ────────────────────────────────────────────────────

export const STATE_IIN: Record<string, string> = {
  AL: '636000', AK: '994000', AZ: '636026', AR: '636021', CA: '636033',
  CO: '636020', CT: '636006', DE: '636011', FL: '636010', GA: '636055',
  HI: '636047', ID: '636050', IL: '636035', IN: '636037', IA: '636018',
  KS: '636022', KY: '636046', LA: '636007', ME: '636041', MD: '636003',
  MA: '636002', MI: '636032', MN: '636038', MS: '636051', MO: '636030',
  MT: '636008', NE: '636054', NV: '636049', NH: '636017', NJ: '636036',
  NM: '636009', NY: '636001', NC: '636004', ND: '636034', OH: '636023',
  OK: '636058', OR: '636029', PA: '636025', RI: '636052', SC: '636005',
  SD: '636042', TN: '636053', TX: '636015', UT: '636040', VT: '636016',
  VA: '636000', WA: '636045', WV: '636061', WI: '636031', WY: '636060',
  DC: '636043', PR: '636052',
};

// ── Lookup tables ─────────────────────────────────────────────────────────

export const EYE_COLORS = [
  { label: 'Black',       value: 'BLK' },
  { label: 'Blue',        value: 'BLU' },
  { label: 'Brown',       value: 'BRO' },
  { label: 'Gray',        value: 'GRY' },
  { label: 'Green',       value: 'GRN' },
  { label: 'Hazel',       value: 'HAZ' },
  { label: 'Maroon',      value: 'MAR' },
  { label: 'Pink',        value: 'PNK' },
  { label: 'Dichromatic', value: 'DIC' },
  { label: 'Unknown',     value: 'UNK' },
];

export const HAIR_COLORS = [
  { label: 'Bald',        value: 'BAL' },
  { label: 'Black',       value: 'BLK' },
  { label: 'Blond',       value: 'BLN' },
  { label: 'Brown',       value: 'BRO' },
  { label: 'Gray',        value: 'GRY' },
  { label: 'Green',       value: 'GRN' },
  { label: 'Red/Auburn',  value: 'RED' },
  { label: 'Sandy',       value: 'SDY' },
  { label: 'White',       value: 'WHI' },
  { label: 'Unknown',     value: 'UNK' },
];

export const RACE_ETHNICITY = [
  { label: 'White',                        value: 'W'  },
  { label: 'Black / African American',     value: 'BK' },
  { label: 'American Indian / Alaska Native', value: 'AI' },
  { label: 'Asian / Pacific Islander',     value: 'AP' },
  { label: 'Hispanic',                     value: 'H'  },
  { label: 'Non-Hispanic',                 value: 'O'  },
  { label: 'Unknown',                      value: 'U'  },
];

export const COMPLIANCE_TYPES = [
  { label: 'F — Fully compliant (REAL ID)',    value: 'F' },
  { label: 'N — Non-compliant',                value: 'N' },
];

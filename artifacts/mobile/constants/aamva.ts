/**
 * AAMVA DL/ID Card Design Standard — Version 8 (2020)
 *
 * Reference: AAMVA DL/ID Card Design Standard, 2020 Edition
 *
 * Barcode data structure:
 *   [File Header] [Subfile Designator(s)] [Subfile Content]
 *
 * File Header (21 bytes fixed):
 *   '@'        Compliance Indicator       (0x40)  1 byte
 *   '\n'       Data Element Separator     (0x0A)  1 byte  ← also used between elements
 *   '\x1e'     Record Separator           (0x1E)  1 byte
 *   '\r'       Segment Terminator         (0x0D)  1 byte
 *   'ANSI '    File Type                          5 bytes
 *   IIN        Issuer Identification Number        6 bytes
 *   '08'       AAMVA Version Number                2 bytes
 *   '00'       Jurisdiction Version Number         2 bytes
 *   '01'       Number of Subfile Entries           2 bytes
 *
 * Subfile Designator (10 bytes per subfile):
 *   'DL'       Subfile Type               2 bytes
 *   OOOO       Byte Offset (4 digits)     4 bytes  ← offset from byte 0 of whole string
 *   LLLL       Byte Length (4 digits)     4 bytes
 *
 * Subfile Content:
 *   'DL'       Type identifier            2 bytes
 *   '\n'       Element separator
 *   TAG+VALUE  Each data element terminated by '\n'
 */

export interface AamvaFields {
  // Personal
  lastName: string;
  firstName: string;
  middleName: string;
  dob: string;       // MMDDYYYY
  sex: string;       // '1'=Male, '2'=Female, '9'=Not Specified
  eyeColor: string;  // BLK BLU BRO GRY GRN HAZ MAR PNK DIC UNK
  hairColor: string; // BAL BLK BLN BRO GRY GRN RED SDY WHI UNK
  height: string;    // FTIN e.g. "510" = 5 ft 10 in
  weight: string;    // lbs (numeric string)

  // License
  state: string;                 // 2-letter abbreviation
  documentNumber: string;        // DAQ — driver license / ID number
  documentDiscriminator: string; // DCF — Document Discriminator (unique doc ID)
  vehicleClass: string;          // DCA e.g. 'C'
  restrictions: string;          // DCB e.g. 'NONE'
  endorsements: string;          // DCD e.g. 'NONE'
  issueDate: string;             // MMDDYYYY
  expiryDate: string;            // MMDDYYYY
  iin: string;                   // 6-digit Issuer Identification Number

  // Address
  address: string;
  city: string;
  zip: string; // 9 chars — ZIP+4, pad with spaces if 5-digit only

  // Metadata
  country: string; // 'USA' or 'CAN'
}

export const defaultAamvaFields: AamvaFields = {
  lastName: '',
  firstName: '',
  middleName: '',
  dob: '',
  sex: '1',
  eyeColor: 'BRO',
  hairColor: 'BRO',
  height: '',
  weight: '',
  state: '',
  documentNumber: '',
  documentDiscriminator: '',
  vehicleClass: 'C',
  restrictions: 'NONE',
  endorsements: 'NONE',
  issueDate: '',
  expiryDate: '',
  iin: '',
  address: '',
  city: '',
  zip: '',
  country: 'USA',
};

/**
 * Build a fully AAMVA v8–compliant barcode string.
 *
 * All mandatory data elements are included per the 2020 spec.
 * The Data Element Separator is LF (0x0A) — NOT CR (0x0D).
 */
export function buildAamvaString(fields: AamvaFields): string {
  const SEP = '\n'; // 0x0A — AAMVA Data Element Separator
  const iin = (fields.iin || '636033').padStart(6, '0').slice(0, 6);

  const elements: string[] = [];

  /** Add element only if value is non-empty */
  const add = (tag: string, value: string) => {
    const v = value.trim();
    if (v) elements.push(tag + v);
  };

  /** Always add element regardless of value */
  const put = (tag: string, value: string) => elements.push(tag + value);

  // ── Mandatory fields per AAMVA v8 §D.2 (order follows the spec) ──────────

  add('DCA', fields.vehicleClass);                       // Vehicle Class
  add('DCB', fields.restrictions || 'NONE');             // Restrictions
  add('DCD', fields.endorsements || 'NONE');             // Endorsements
  add('DBA', fields.expiryDate);                         // Expiration Date (MMDDYYYY)
  add('DCS', fields.lastName);                           // Family Name
  add('DAC', fields.firstName);                          // First Name
  add('DAD', fields.middleName);                         // Middle Name
  add('DBD', fields.issueDate);                          // Issue Date (MMDDYYYY)
  add('DBB', fields.dob);                                // Date of Birth (MMDDYYYY)
  put('DBC', fields.sex || '1');                         // Sex (1/2/9)
  add('DAY', fields.eyeColor);                           // Eye Color

  // Height: user enters FTIN string (e.g. "510" = 5'10"), output as-is with unit suffix
  if (fields.height.trim()) {
    elements.push('DAU' + fields.height.trim() + ' in');
  }

  add('DAG', fields.address);                            // Street Address
  add('DAI', fields.city);                               // City

  // State (DAJ): uppercase 2-letter abbreviation
  if (fields.state.trim()) {
    elements.push('DAJ' + fields.state.trim().toUpperCase());
  }

  // Postal Code (DAK): exactly 9 chars, right-padded with spaces
  if (fields.zip.trim()) {
    elements.push('DAK' + fields.zip.trim().padEnd(9, ' ').slice(0, 9));
  }

  add('DAQ', fields.documentNumber);                     // License Number

  // DCF — Document Discriminator (mandatory in v8)
  add('DCF', fields.documentDiscriminator);

  put('DCG', fields.country || 'USA');                   // Country (USA/CAN)

  // ── Optional but commonly present ────────────────────────────────────────

  add('DAZ', fields.hairColor);                          // Hair Color
  add('DAW', fields.weight);                             // Weight (lbs)

  // Truncation indicators — N = Not truncated, T = Truncated, U = Unknown
  // Required mandatory fields in AAMVA v8
  put('DDE', 'N');  // Family name truncation
  put('DDF', 'N');  // First name truncation
  put('DDG', 'N');  // Middle name truncation

  // ── Assemble the subfile ──────────────────────────────────────────────────

  // Subfile: type identifier + SEP + elements each terminated by SEP
  const subfileBody = 'DL' + SEP + elements.join(SEP) + SEP;

  // ── Assemble the header ───────────────────────────────────────────────────
  //
  // Fixed 21-byte header prefix (no trailing CR):
  //   '@\n\x1e\r' (4) + 'ANSI ' (5) + IIN (6) + '08' (2) + '00' (2) + '01' (2)
  //
  const headerPrefix = '@\n\x1e\rANSI ' + iin + '080001';
  // Offset to subfile = headerPrefix (21) + one designator (10) = 31
  const offset = headerPrefix.length + 10; // always 31
  const length = subfileBody.length;
  const designator =
    'DL' +
    String(offset).padStart(4, '0') +
    String(length).padStart(4, '0');

  return headerPrefix + designator + subfileBody;
}

// ── State → IIN lookup ────────────────────────────────────────────────────

/** Maps US state/territory abbreviations to AAMVA Issuer Identification Numbers */
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

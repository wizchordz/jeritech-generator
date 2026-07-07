/**
 * AAMVA DL/ID Card Design Standard — Version 8
 * Builds the standard AAMVA string used as the text content of a PDF417 barcode.
 *
 * Reference: AAMVA DL/ID Card Design Standard, 2020
 */

export interface AamvaFields {
  // Section 1: Personal
  lastName: string;
  firstName: string;
  middleName: string;
  dob: string;       // MMDDYYYY — Date of Birth
  sex: string;       // 1=Male, 2=Female, 9=Not Specified
  eyeColor: string;  // BLK, BLU, BRO, GRY, GRN, HAZ, MAR, PNK, DIC, UNK
  hairColor: string; // BAL, BLK, BLN, BRO, GRY, GRN, MED, RED, SDY, WHI, UNK
  height: string;    // FTIN e.g. "510" = 5'10"
  weight: string;    // lbs (numeric string)

  // Section 2: License
  state: string;          // 2-letter abbreviation e.g. "CA"
  documentNumber: string; // DAQ — driver license / ID number
  vehicleClass: string;   // DCA e.g. "C", "D", "A"
  restrictions: string;   // DCB e.g. "NONE" or "B"
  endorsements: string;   // DCD e.g. "NONE" or "H"
  issueDate: string;      // MMDDYYYY
  expiryDate: string;     // MMDDYYYY
  iin: string;            // 6-digit Issuer Identification Number

  // Section 3: Address
  address: string; // Street address
  city: string;
  zip: string;     // 9 chars, pad with spaces if needed

  // Optional
  country: string; // USA or CAN
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
 * Build a valid AAMVA v8 string from the provided fields.
 *
 * Structure:
 *   [Header] + [Designators] + [SubfileContent]
 *
 * Header:   "@\n\x1e\rANSI " + IIN(6) + AAMVA_VER(2) + JURIS_VER(2) + NUM_SUBFILES(2) + "\r"
 * Designator: "DL" + offset(4) + length(4)
 * Subfile:  "DL\r" + data elements joined by "\r" + "\r"
 */
export function buildAamvaString(fields: AamvaFields): string {
  const iin = (fields.iin || '636033').padStart(6, '0').slice(0, 6);

  // Build ordered data elements — only include non-empty values
  const el = (tag: string, value: string) =>
    value.trim() ? `${tag}${value.trim()}` : null;

  const elements: string[] = [
    el('DAQ', fields.documentNumber),
    el('DCS', fields.lastName),
    el('DAC', fields.firstName),
    el('DAD', fields.middleName),
    el('DBA', fields.expiryDate),
    el('DBD', fields.issueDate),
    el('DBB', fields.dob),
    el('DCA', fields.vehicleClass),
    el('DCB', fields.restrictions),
    el('DCD', fields.endorsements),
    el('DAG', fields.address),
    el('DAI', fields.city),
    el('DAJ', fields.state),
    // ZIP must be exactly 9 chars, right-padded with spaces
    fields.zip.trim()
      ? `DAK${fields.zip.trim().padEnd(9, ' ').slice(0, 9)}`
      : null,
    el('DAY', fields.eyeColor),
    el('DAZ', fields.hairColor),
    el('DAU', fields.height),
    el('DAW', fields.weight),
    el('DBC', fields.sex),
    `DCG${fields.country || 'USA'}`,
  ].filter((e): e is string => e !== null);

  // Subfile content: type identifier + data rows
  const subfileContent = 'DL\r' + elements.join('\r') + '\r';

  // Header line: 9-char prefix + IIN + version info + CR
  // "@" + LF + RS(0x1e) + CR + "ANSI " = 9 chars
  // + IIN(6) + AAMVA_VER "08" + JURIS_VER "01" + NUM_SUBFILES "01" + CR
  const headerLine = `@\n\x1e\rANSI ${iin}080101\r`;

  // Designator: "DL" (2) + offset (4) + length (4) = 10 chars total
  const offset = headerLine.length + 10;
  const length = subfileContent.length;
  const designator = `DL${String(offset).padStart(4, '0')}${String(length).padStart(4, '0')}`;

  return headerLine + designator + subfileContent;
}

/** Maps US state abbreviations to AAMVA Issuer Identification Numbers */
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

export const EYE_COLORS = [
  { label: 'Black', value: 'BLK' },
  { label: 'Blue', value: 'BLU' },
  { label: 'Brown', value: 'BRO' },
  { label: 'Gray', value: 'GRY' },
  { label: 'Green', value: 'GRN' },
  { label: 'Hazel', value: 'HAZ' },
  { label: 'Maroon', value: 'MAR' },
  { label: 'Pink', value: 'PNK' },
  { label: 'Dichromatic', value: 'DIC' },
  { label: 'Unknown', value: 'UNK' },
];

export const HAIR_COLORS = [
  { label: 'Bald', value: 'BAL' },
  { label: 'Black', value: 'BLK' },
  { label: 'Blond', value: 'BLN' },
  { label: 'Brown', value: 'BRO' },
  { label: 'Gray', value: 'GRY' },
  { label: 'Green', value: 'GRN' },
  { label: 'Red/Auburn', value: 'RED' },
  { label: 'Sandy', value: 'SDY' },
  { label: 'White', value: 'WHI' },
  { label: 'Unknown', value: 'UNK' },
];

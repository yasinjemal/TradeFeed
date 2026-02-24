// ============================================================
// CSV Parser — Bulk Product Import
// ============================================================
// Simple, zero-dependency CSV parser for product import.
// Handles quoted fields, commas in values, and newlines.
// ============================================================

export interface CsvRow {
  [key: string]: string;
}

export interface CsvParseResult {
  headers: string[];
  rows: CsvRow[];
  errors: { row: number; message: string }[];
}

/**
 * Parse a CSV string into structured rows.
 * Handles: quoted fields, commas in values, CRLF/LF.
 */
export function parseCsv(text: string): CsvParseResult {
  const lines = splitCsvLines(text.trim());
  if (lines.length === 0) {
    return { headers: [], rows: [], errors: [{ row: 0, message: "Empty CSV file" }] };
  }

  const headers = parseCsvLine(lines[0]!).map((h) => h.trim().toLowerCase());
  const rows: CsvRow[] = [];
  const errors: { row: number; message: string }[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]!.trim();
    if (!line) continue; // Skip blank lines

    const values = parseCsvLine(line);

    if (values.length !== headers.length) {
      errors.push({
        row: i + 1,
        message: `Expected ${headers.length} columns, got ${values.length}`,
      });
      continue;
    }

    const row: CsvRow = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]!] = values[j]?.trim() ?? "";
    }
    rows.push(row);
  }

  return { headers, rows, errors };
}

/**
 * Split CSV text into lines, respecting quoted fields that contain newlines.
 */
function splitCsvLines(text: string): string[] {
  const lines: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i]!;
    if (char === '"') {
      inQuotes = !inQuotes;
      current += char;
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && text[i + 1] === "\n") i++; // Skip \r\n
      lines.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Parse a single CSV line into field values.
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i]!;

    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"'; // Escaped quote
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        fields.push(current);
        current = "";
      } else {
        current += char;
      }
    }
  }
  fields.push(current);
  return fields;
}

// ── Column Mapping ──────────────────────────────────────────

/** Required columns for product import */
export const REQUIRED_COLUMNS = ["name", "price", "stock"] as const;

/** Optional columns */
export const OPTIONAL_COLUMNS = [
  "description",
  "category",
  "size",
  "color",
  "sku",
  "option1label",
  "option2label",
  "active",
] as const;

/** All recognized columns */
export const ALL_COLUMNS = [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS] as const;

/** Column aliases (common CSV headers → our column names) */
const COLUMN_ALIASES: Record<string, string> = {
  "product name": "name",
  "product_name": "name",
  "title": "name",
  "product": "name",
  "price (rands)": "price",
  "price_in_rands": "price",
  "price (r)": "price",
  "unit price": "price",
  "unit_price": "price",
  "stock quantity": "stock",
  "stock_quantity": "stock",
  "qty": "stock",
  "quantity": "stock",
  "variant size": "size",
  "variant_size": "size",
  "option1": "size",
  "option 1": "size",
  "variant color": "color",
  "variant_color": "color",
  "option2": "color",
  "option 2": "color",
  "option 1 label": "option1label",
  "option_1_label": "option1label",
  "option 2 label": "option2label",
  "option_2_label": "option2label",
  "is active": "active",
  "is_active": "active",
  "status": "active",
};

/**
 * Auto-map CSV headers to our expected column names.
 * Returns the mapping and any unmapped headers.
 */
export function autoMapColumns(
  headers: string[]
): { mapping: Record<string, string>; unmapped: string[] } {
  const mapping: Record<string, string> = {};
  const unmapped: string[] = [];

  for (const header of headers) {
    const lower = header.toLowerCase().trim();

    // Direct match
    if ((ALL_COLUMNS as readonly string[]).includes(lower)) {
      mapping[header] = lower;
      continue;
    }

    // Alias match
    const alias = COLUMN_ALIASES[lower];
    if (alias) {
      mapping[header] = alias;
      continue;
    }

    unmapped.push(header);
  }

  return { mapping, unmapped };
}

/**
 * Validate that required columns are mapped.
 */
export function validateColumnMapping(
  mapping: Record<string, string>
): { valid: boolean; missing: string[] } {
  const mappedValues = new Set(Object.values(mapping));
  const missing = REQUIRED_COLUMNS.filter((col) => !mappedValues.has(col));
  return { valid: missing.length === 0, missing };
}

/**
 * Generate a sample CSV template string for download.
 */
export function generateCsvTemplate(): string {
  const headers = ["name", "description", "price", "stock", "size", "color", "sku", "category"];
  const sampleRows = [
    ["Floral Summer Dress", "Beautiful dress for summer", "299.99", "50", "M", "Red", "FSD-M-RED", "Dresses"],
    ["Floral Summer Dress", "Beautiful dress for summer", "299.99", "30", "L", "Red", "FSD-L-RED", "Dresses"],
    ["Classic T-Shirt", "Cotton everyday tee", "149.50", "100", "XL", "Black", "CTS-XL-BLK", "T-Shirts"],
  ];

  return [
    headers.join(","),
    ...sampleRows.map((row) => row.map((v) => `"${v}"`).join(",")),
  ].join("\n");
}

// ============================================================
// Export Utilities — CSV & PDF Report Generation
// ============================================================
// Client-side export helpers for orders and revenue data.
// CSV: Direct download via Blob + anchor pattern.
// PDF: Styled HTML opened in a print window (no dependencies).
//
// DESIGN:
// - No external libraries required (jsPDF, puppeteer, etc.)
// - All data comes from props already on the page
// - Print-to-PDF uses a clean, branded layout
// - CSV is RFC 4180 compliant (quoted fields, escaped quotes)
// ============================================================

/**
 * Escape a CSV field value.
 * Wraps in double-quotes if the value contains commas, quotes, or newlines.
 */
function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convert an array of objects to a CSV string.
 *
 * @param headers - Column definitions: { key, label }
 * @param rows    - Array of data objects
 * @returns       - RFC 4180 CSV string with BOM for Excel compatibility
 */
export function generateCsv<T extends Record<string, unknown>>(
  headers: { key: keyof T & string; label: string }[],
  rows: T[],
): string {
  const headerLine = headers.map((h) => csvEscape(h.label)).join(",");
  const dataLines = rows.map((row) =>
    headers.map((h) => csvEscape(row[h.key] as string | number | null)).join(","),
  );
  // BOM (\uFEFF) ensures Excel opens the file with correct UTF-8 encoding
  return "\uFEFF" + [headerLine, ...dataLines].join("\n");
}

/**
 * Trigger a file download in the browser.
 *
 * @param content  - File content as string
 * @param filename - Suggested filename
 * @param mimeType - MIME type (default: text/csv)
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string = "text/csv;charset=utf-8",
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Open a styled print window for PDF generation.
 * The browser's "Save as PDF" in the print dialog creates a clean report.
 *
 * @param title   - Report title
 * @param content - HTML content for the report body
 */
export function printReport(title: string, content: string): void {
  const win = window.open("", "_blank");
  if (!win) {
    alert("Please allow pop-ups to generate PDF reports.");
    return;
  }

  win.document.write(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${title} — TradeFeed</title>
  <style>
    @page { margin: 15mm 12mm; size: A4; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #1c1917;
      font-size: 11px;
      line-height: 1.5;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #10b981;
      padding-bottom: 12px;
      margin-bottom: 20px;
    }
    .brand {
      font-size: 18px;
      font-weight: 700;
      color: #1c1917;
    }
    .brand span { color: #10b981; }
    .meta { text-align: right; color: #78716c; font-size: 10px; }
    h1 { font-size: 16px; font-weight: 700; margin-bottom: 16px; color: #1c1917; }
    h2 { font-size: 13px; font-weight: 600; margin: 20px 0 8px; color: #44403c; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }
    th {
      text-align: left;
      padding: 6px 8px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #78716c;
      border-bottom: 1px solid #e7e5e4;
      background: #fafaf9;
    }
    td {
      padding: 6px 8px;
      border-bottom: 1px solid #f5f5f4;
      font-size: 11px;
    }
    tr:nth-child(even) td { background: #fafaf9; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-bold { font-weight: 600; }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }
    .summary-card {
      border: 1px solid #e7e5e4;
      border-radius: 8px;
      padding: 12px;
    }
    .summary-card .label { font-size: 9px; text-transform: uppercase; color: #78716c; letter-spacing: 0.05em; }
    .summary-card .value { font-size: 18px; font-weight: 700; margin-top: 4px; }
    .footer {
      margin-top: 30px;
      padding-top: 10px;
      border-top: 1px solid #e7e5e4;
      font-size: 9px;
      color: #a8a29e;
      text-align: center;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">Trade<span>Feed</span></div>
    <div class="meta">
      Generated ${new Date().toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" })}<br/>
      ${new Date().toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
    </div>
  </div>
  ${content}
  <div class="footer">
    This report was generated by TradeFeed &mdash; trade-feed.vercel.app
  </div>
</body>
</html>
  `);

  win.document.close();
  // Small delay to ensure styles are applied before print dialog
  setTimeout(() => win.print(), 300);
}

// ── Formatters for Reports ──────────────────────────────────

export function formatRandsPlain(cents: number): string {
  return `R ${(cents / 100).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

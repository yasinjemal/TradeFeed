// ============================================================
// Server Actions — Bulk Product Import
// ============================================================
// Handles CSV parsing, validation, and batch product creation.
// Respects product limits, handles duplicates, creates variants.
// ============================================================

"use server";

import { revalidatePath } from "next/cache";
import { requireShopAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseCsv, autoMapColumns, validateColumnMapping, type CsvRow } from "@/lib/csv/parser";
import { createProduct } from "@/lib/db/products";
import { syncProductPriceRange } from "@/lib/db/variants";

type ImportResult = {
  success: boolean;
  error?: string;
  totalRows?: number;
  imported?: number;
  skipped?: number;
  errors?: { row: number; message: string }[];
};

interface ParsedProductRow {
  name: string;
  description: string;
  price: number; // in rands
  stock: number;
  size: string;
  color: string;
  sku: string;
  category: string;
  option1Label: string;
  option2Label: string;
  isActive: boolean;
}

/**
 * Validate and transform a mapped CSV row into a product row.
 */
function validateRow(
  row: CsvRow,
  mapping: Record<string, string>,
  rowIndex: number,
): { data: ParsedProductRow | null; error: string | null } {
  // Reverse mapping: column name → CSV header
  const reverseMap: Record<string, string> = {};
  for (const [csvHeader, colName] of Object.entries(mapping)) {
    reverseMap[colName] = csvHeader;
  }

  const getValue = (col: string): string => {
    const header = reverseMap[col];
    return header ? (row[header] ?? "").trim() : "";
  };

  const name = getValue("name");
  if (!name || name.length < 2) {
    return { data: null, error: `Row ${rowIndex}: Product name is required (min 2 chars)` };
  }
  if (name.length > 200) {
    return { data: null, error: `Row ${rowIndex}: Product name too long (max 200 chars)` };
  }

  const priceStr = getValue("price");
  const price = parseFloat(priceStr);
  if (isNaN(price) || price <= 0) {
    return { data: null, error: `Row ${rowIndex}: Invalid price "${priceStr}"` };
  }
  if (price > 999999) {
    return { data: null, error: `Row ${rowIndex}: Price exceeds R999,999` };
  }

  const stockStr = getValue("stock");
  const stock = parseInt(stockStr, 10);
  if (isNaN(stock) || stock < 0) {
    return { data: null, error: `Row ${rowIndex}: Invalid stock "${stockStr}"` };
  }

  const size = getValue("size") || "Default";
  const color = getValue("color");
  const sku = getValue("sku");
  const description = getValue("description");
  const category = getValue("category");
  const option1Label = getValue("option1label") || "Size";
  const option2Label = getValue("option2label") || "Color";
  const activeStr = getValue("active").toLowerCase();
  const isActive = activeStr === "" || activeStr === "true" || activeStr === "yes" || activeStr === "1";

  return {
    data: {
      name,
      description,
      price,
      stock,
      size,
      color,
      sku,
      category,
      option1Label,
      option2Label,
      isActive,
    },
    error: null,
  };
}

/**
 * Bulk import products from CSV content.
 */
export async function bulkImportAction(
  shopSlug: string,
  csvContent: string,
  columnMapping?: Record<string, string>,
): Promise<ImportResult> {
  try {
    // 1. Auth check
    const access = await requireShopAccess(shopSlug);
    if (!access) {
      return { success: false, error: "Shop not found or access denied." };
    }

    // 2. Parse CSV
    const { headers, rows, errors: parseErrors } = parseCsv(csvContent);
    if (rows.length === 0) {
      return {
        success: false,
        error: parseErrors.length > 0
          ? parseErrors[0]!.message
          : "No data rows found in CSV.",
      };
    }

    // 3. Map columns
    const mapping = columnMapping ?? autoMapColumns(headers).mapping;
    const { valid, missing } = validateColumnMapping(mapping);
    if (!valid) {
      return {
        success: false,
        error: `Missing required columns: ${missing.join(", ")}. Found: ${headers.join(", ")}`,
      };
    }

    // 4. Check product limit
    const { checkProductLimit } = await import("@/lib/db/subscriptions");
    const limit = await checkProductLimit(access.shopId);

    // Count unique product names in CSV
    const uniqueNames = new Set(rows.map((r) => {
      const reverseMap: Record<string, string> = {};
      for (const [csvH, colN] of Object.entries(mapping)) {
        reverseMap[colN] = csvH;
      }
      const nameHeader = reverseMap["name"];
      return nameHeader ? (r[nameHeader] ?? "").trim().toLowerCase() : "";
    }));

    if (!limit.allowed && limit.current + uniqueNames.size > limit.limit) {
      return {
        success: false,
        error: `Import would exceed product limit (${limit.current}/${limit.limit}). CSV contains ${uniqueNames.size} unique products. Upgrade to Pro for unlimited products.`,
      };
    }

    // 5. Validate all rows first
    const validatedRows: ParsedProductRow[] = [];
    const rowErrors: { row: number; message: string }[] = [...parseErrors];

    for (let i = 0; i < rows.length; i++) {
      const { data, error } = validateRow(rows[i]!, mapping, i + 2); // +2 for header + 1-indexed
      if (error) {
        rowErrors.push({ row: i + 2, message: error });
      } else if (data) {
        validatedRows.push(data);
      }
    }

    if (validatedRows.length === 0) {
      return {
        success: false,
        error: "No valid rows to import.",
        errors: rowErrors,
        totalRows: rows.length,
        imported: 0,
        skipped: rows.length,
      };
    }

    // 6. Get existing categories for this shop
    const existingCategories = await db.category.findMany({
      where: { shopId: access.shopId },
      select: { id: true, name: true, slug: true },
    });
    const categoryMap = new Map(
      existingCategories.map((c) => [c.name.toLowerCase(), c.id]),
    );

    // 7. Group rows by product name (rows with same name = variants of same product)
    const productGroups = new Map<string, ParsedProductRow[]>();
    for (const row of validatedRows) {
      const key = row.name.toLowerCase();
      const existing = productGroups.get(key) ?? [];
      existing.push(row);
      productGroups.set(key, existing);
    }

    // 8. Create products + variants in batch
    let imported = 0;
    let skipped = 0;

    for (const [, groupRows] of productGroups) {
      const first = groupRows[0]!;

      try {
        // Resolve or create category
        let categoryId: string | null = null;
        if (first.category) {
          categoryId = categoryMap.get(first.category.toLowerCase()) ?? null;
          if (!categoryId) {
            // Create category on the fly
            const slug = first.category
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/(^-|-$)/g, "");
            const newCat = await db.category.create({
              data: {
                name: first.category,
                slug: slug || `cat-${Date.now()}`,
                shopId: access.shopId,
              },
            });
            categoryId = newCat.id;
            categoryMap.set(first.category.toLowerCase(), categoryId);
          }
        }

        // Create the product
        const product = await createProduct(
          {
            name: first.name,
            description: first.description || undefined,
            isActive: first.isActive,
            categoryId: categoryId ?? undefined,
            option1Label: first.option1Label,
            option2Label: first.option2Label,
          },
          access.shopId,
        );

        // Create variants for all rows in this group
        for (const row of groupRows) {
          try {
            await db.productVariant.create({
              data: {
                productId: product.id,
                size: row.size,
                color: row.color || null,
                priceInCents: Math.round(row.price * 100),
                stock: row.stock,
                sku: row.sku || null,
                isActive: true,
              },
            });
            imported++;
          } catch (variantErr) {
            // Likely duplicate size+color — skip
            skipped++;
            rowErrors.push({
              row: 0,
              message: `Skipped duplicate variant for "${first.name}" (${row.size}/${row.color || "N/A"})`,
            });
          }
        }

        // Sync denormalized price range after creating all variants
        await syncProductPriceRange(product.id);
      } catch (productErr) {
        skipped += groupRows.length;
        rowErrors.push({
          row: 0,
          message: `Failed to create product "${first.name}": ${productErr instanceof Error ? productErr.message : "Unknown error"}`,
        });
      }
    }

    // 9. Log the import job
    await db.bulkImportJob.create({
      data: {
        shopId: access.shopId,
        fileName: "csv-import",
        status: rowErrors.length > 0 && imported === 0 ? "FAILED" : "COMPLETED",
        totalRows: rows.length,
        successCount: imported,
        errorCount: skipped + rowErrors.length,
        errors: rowErrors.length > 0 ? JSON.stringify(rowErrors.slice(0, 50)) : null,
        completedAt: new Date(),
      },
    });

    // 10. Revalidate
    revalidatePath(`/dashboard/${shopSlug}/products`);

    return {
      success: true,
      totalRows: rows.length,
      imported,
      skipped,
      errors: rowErrors.length > 0 ? rowErrors : undefined,
    };
  } catch (error) {
    console.error("[bulkImportAction] Error:", error);
    return {
      success: false,
      error: "Import failed. Please try again.",
    };
  }
}

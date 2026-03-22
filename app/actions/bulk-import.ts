// ============================================================
// Server Actions — Bulk Product Import
// ============================================================
// Handles CSV parsing, validation, and batch product creation.
// Supports optional image URLs with AI-driven product analysis.
// Respects product limits, handles duplicates, creates variants.
// ============================================================

"use server";

import { revalidatePath } from "next/cache";
import { requireShopAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseCsv, autoMapColumns, validateColumnMapping, type CsvRow } from "@/lib/csv/parser";
import { createProduct } from "@/lib/db/products";
import { syncProductPriceRange } from "@/lib/db/variants";
import { analyzeProductImages, type AiProductAnalysis } from "@/lib/ai/analyze-product-image";
import { checkAiAccess, trackAiGeneration } from "@/lib/db/ai";

type ImportResult = {
  success: boolean;
  error?: string;
  totalRows?: number;
  imported?: number;
  skipped?: number;
  aiAnalyzed?: number;
  errors?: { row: number; message: string }[];
};

export interface BulkImageItem {
  url: string;
  name: string;
}

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
 * Resolve or create a shop-level category, returning its ID.
 */
async function resolveCategory(
  categoryName: string,
  shopId: string,
  categoryMap: Map<string, string>,
): Promise<string> {
  const existing = categoryMap.get(categoryName.toLowerCase());
  if (existing) return existing;

  const slug = categoryName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const newCat = await db.category.create({
    data: {
      name: categoryName,
      slug: slug || `cat-${Date.now()}`,
      shopId,
    },
  });
  categoryMap.set(categoryName.toLowerCase(), newCat.id);
  return newCat.id;
}

/**
 * Bulk import products from CSV content, optionally enriched with
 * AI analysis of uploaded images.
 *
 * Images are matched to CSV product groups in order: image 1 → first
 * unique product, image 2 → second, etc. Surplus images (no CSV match)
 * create standalone AI-generated products.
 */
export async function bulkImportAction(
  shopSlug: string,
  csvContent: string,
  columnMapping?: Record<string, string>,
  images?: BulkImageItem[],
): Promise<ImportResult> {
  try {
    // 1. Auth check
    const access = await requireShopAccess(shopSlug);
    if (!access) {
      return { success: false, error: "Shop not found or access denied." };
    }

    // 2. Parse CSV
    const { headers, rows, errors: parseErrors } = parseCsv(csvContent);
    const hasCsv = rows.length > 0;
    const hasImages = images && images.length > 0;

    if (!hasCsv && !hasImages) {
      return {
        success: false,
        error: "Please provide a CSV file and/or product images.",
      };
    }

    // 3. Map columns (only if CSV data present)
    let mapping: Record<string, string> = {};
    if (hasCsv) {
      mapping = columnMapping ?? autoMapColumns(headers).mapping;
      const { valid, missing } = validateColumnMapping(mapping);
      if (!valid) {
        return {
          success: false,
          error: `Missing required columns: ${missing.join(", ")}. Found: ${headers.join(", ")}`,
        };
      }
    }

    // 4. Validate CSV rows
    const validatedRows: ParsedProductRow[] = [];
    const rowErrors: { row: number; message: string }[] = [...parseErrors];

    for (let i = 0; i < rows.length; i++) {
      const { data, error } = validateRow(rows[i]!, mapping, i + 2);
      if (error) {
        rowErrors.push({ row: i + 2, message: error });
      } else if (data) {
        validatedRows.push(data);
      }
    }

    // Group CSV rows by product name
    const productGroups: Map<string, ParsedProductRow[]> = new Map();
    for (const row of validatedRows) {
      const key = row.name.toLowerCase();
      const existing = productGroups.get(key) ?? [];
      existing.push(row);
      productGroups.set(key, existing);
    }
    const productGroupKeys = [...productGroups.keys()];

    // 5. Check product limit
    const { checkProductLimit } = await import("@/lib/db/subscriptions");
    const limit = await checkProductLimit(access.shopId);
    const csvProductCount = productGroups.size;
    const extraImageCount = hasImages
      ? Math.max(0, images.length - csvProductCount)
      : 0;
    const totalNewProducts = csvProductCount + extraImageCount;

    if (!limit.allowed && limit.current + totalNewProducts > limit.limit) {
      return {
        success: false,
        error: `Import would exceed product limit (${limit.current}/${limit.limit}). This import would add ${totalNewProducts} products. Upgrade to Pro for unlimited products.`,
      };
    }

    // 6. AI analysis of uploaded images
    let aiResults: (AiProductAnalysis | null)[] = [];
    let aiAnalyzedCount = 0;

    if (hasImages) {
      const aiAccess = await checkAiAccess(access.shopId);
      const creditsAvailable = aiAccess.hasUnlimitedAi
        ? images.length
        : Math.min(images.length, aiAccess.creditsRemaining);

      if (creditsAvailable > 0) {
        const imagesToAnalyze = images.slice(0, creditsAvailable);
        aiResults = await analyzeProductImages(
          imagesToAnalyze.map((img) => ({ url: img.url, hint: img.name })),
        );
        aiAnalyzedCount = aiResults.filter(Boolean).length;

        for (let i = 0; i < aiAnalyzedCount; i++) {
          await trackAiGeneration(access.shopId);
        }
      }

      if (creditsAvailable < images.length) {
        rowErrors.push({
          row: 0,
          message: `AI credits exhausted — ${images.length - creditsAvailable} image(s) were not analyzed. Upgrade your plan for more AI generations.`,
        });
      }
    }

    // 7. Get existing categories
    const existingCategories = await db.category.findMany({
      where: { shopId: access.shopId },
      select: { id: true, name: true, slug: true },
    });
    const categoryMap = new Map(
      existingCategories.map((c) => [c.name.toLowerCase(), c.id]),
    );

    // 8. Create products
    let imported = 0;
    let skipped = 0;

    // 8a. CSV-based products (enriched with AI data from matching image)
    let groupIndex = 0;
    for (const [, groupRows] of productGroups) {
      const first = groupRows[0]!;
      const matchingAi = groupIndex < aiResults.length ? aiResults[groupIndex] : null;
      const matchingImage = hasImages && groupIndex < images.length ? images[groupIndex] : null;

      try {
        // AI fills gaps: use CSV data first, AI data as fallback
        const description = first.description || matchingAi?.description || undefined;
        const category = first.category || matchingAi?.category || "";

        let categoryId: string | null = null;
        if (category) {
          categoryId = await resolveCategory(category, access.shopId, categoryMap);
        }

        const product = await createProduct(
          {
            name: first.name,
            description,
            isActive: first.isActive,
            categoryId: categoryId ?? undefined,
            option1Label: first.option1Label,
            option2Label: first.option2Label,
            minWholesaleQty: 1,
            wholesaleOnly: false,
            aiGenerated: !!matchingAi,
          },
          access.shopId,
        );

        // Attach image if matched
        if (matchingImage) {
          await db.productImage.create({
            data: {
              productId: product.id,
              url: matchingImage.url,
              altText: first.name,
              position: 0,
            },
          });
        }

        // Create variants
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
          } catch {
            skipped++;
            rowErrors.push({
              row: 0,
              message: `Skipped duplicate variant for "${first.name}" (${row.size}/${row.color || "N/A"})`,
            });
          }
        }

        await syncProductPriceRange(product.id);
      } catch (productErr) {
        skipped += groupRows.length;
        rowErrors.push({
          row: 0,
          message: `Failed to create product "${first.name}": ${productErr instanceof Error ? productErr.message : "Unknown error"}`,
        });
      }

      groupIndex++;
    }

    // 8b. Image-only products (surplus images not matched to CSV rows)
    if (hasImages) {
      for (let i = csvProductCount; i < images.length; i++) {
        const img = images[i]!;
        const ai = i < aiResults.length ? aiResults[i] : null;

        if (!ai) {
          rowErrors.push({
            row: 0,
            message: `Image "${img.name}" could not be analyzed by AI — skipped.`,
          });
          skipped++;
          continue;
        }

        try {
          const categoryId = ai.category && ai.category !== "Other"
            ? await resolveCategory(ai.category, access.shopId, categoryMap)
            : null;

          const product = await createProduct(
            {
              name: ai.name,
              description: ai.description,
              isActive: true,
              categoryId: categoryId ?? undefined,
              option1Label: "Size",
              option2Label: "Color",
              minWholesaleQty: 1,
              wholesaleOnly: false,
              aiGenerated: true,
            },
            access.shopId,
          );

          await db.product.update({
            where: { id: product.id },
            data: { source: "CSV" },
          });

          await db.productImage.create({
            data: {
              productId: product.id,
              url: img.url,
              altText: ai.name,
              position: 0,
            },
          });

          // Default variant — seller edits price/stock later
          await db.productVariant.create({
            data: {
              productId: product.id,
              size: "Default",
              color: null,
              priceInCents: 0,
              stock: 0,
              isActive: false,
            },
          });

          await syncProductPriceRange(product.id);
          imported++;
        } catch (err) {
          skipped++;
          rowErrors.push({
            row: 0,
            message: `Failed to create AI product "${ai.name}": ${err instanceof Error ? err.message : "Unknown error"}`,
          });
        }
      }
    }

    if (imported === 0 && hasCsv && validatedRows.length === 0 && !hasImages) {
      return {
        success: false,
        error: "No valid rows to import.",
        errors: rowErrors,
        totalRows: rows.length,
        imported: 0,
        skipped: rows.length,
      };
    }

    // 9. Log the import job
    await db.bulkImportJob.create({
      data: {
        shopId: access.shopId,
        fileName: hasImages ? `csv+images-import (${images?.length ?? 0} images)` : "csv-import",
        status: imported === 0 ? "FAILED" : "COMPLETED",
        totalRows: rows.length + (images?.length ?? 0),
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
      totalRows: rows.length + extraImageCount,
      imported,
      skipped,
      aiAnalyzed: aiAnalyzedCount > 0 ? aiAnalyzedCount : undefined,
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

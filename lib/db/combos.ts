// ============================================================
// Data Access — Combos
// ============================================================
// CRUD for Combo, ComboCategory, ComboItem. All scoped by shopId.
// ============================================================

import { db } from "@/lib/db";
import type { ComboCreateInput, ComboUpdateInput } from "@/lib/validation/combo";

// ── Slugify ─────────────────────────────────────────────────

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ══════════════════════════════════════════════════════════════
// COMBO CATEGORIES
// ══════════════════════════════════════════════════════════════

export async function getComboCategories(shopId: string) {
  return db.comboCategory.findMany({
    where: { shopId },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { combos: true } },
    },
  });
}

export async function createComboCategory(shopId: string, name: string) {
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await db.comboCategory.findUnique({
      where: { shopId_slug: { shopId, slug } },
    });
    if (!existing) break;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return db.comboCategory.create({
    data: { name: name.trim(), slug, shopId },
    include: { _count: { select: { combos: true } } },
  });
}

export async function deleteComboCategory(categoryId: string, shopId: string) {
  const category = await db.comboCategory.findFirst({
    where: { id: categoryId, shopId },
  });
  if (!category) return null;

  return db.comboCategory.delete({ where: { id: categoryId } });
}

// ══════════════════════════════════════════════════════════════
// COMBOS
// ══════════════════════════════════════════════════════════════

/** Get all combos for a shop (dashboard) */
export async function getCombos(shopId: string) {
  return db.combo.findMany({
    where: { shopId },
    include: {
      items: true,
      images: { orderBy: { position: "asc" }, take: 1 },
      comboCategory: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

/** Get a single combo by ID (dashboard) */
export async function getCombo(comboId: string, shopId: string) {
  return db.combo.findFirst({
    where: { id: comboId, shopId },
    include: {
      items: true,
      images: { orderBy: { position: "asc" } },
      comboCategory: { select: { id: true, name: true } },
    },
  });
}

/** Create a combo with items */
export async function createCombo(input: ComboCreateInput, shopId: string) {
  return db.combo.create({
    data: {
      name: input.name,
      description: input.description || null,
      priceCents: input.priceInRands, // already converted to cents by Zod
      retailPriceCents: input.retailPriceInRands ?? null,
      stock: input.stock,
      isActive: input.isActive,
      shopId,
      comboCategoryId: input.comboCategoryId || null,
      items: {
        create: input.items.map((item) => ({
          productId: item.productId || null,
          variantId: item.variantId || null,
          productName: item.productName,
          variantLabel: item.variantLabel || null,
          quantity: item.quantity,
        })),
      },
    },
    include: {
      items: true,
      images: { orderBy: { position: "asc" } },
      comboCategory: true,
    },
  });
}

/** Update a combo (partial) */
export async function updateCombo(
  comboId: string,
  shopId: string,
  input: ComboUpdateInput
) {
  const existing = await db.combo.findFirst({
    where: { id: comboId, shopId },
  });
  if (!existing) return null;

  // Build update data
  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description || null;
  if (input.priceInRands !== undefined) data.priceCents = input.priceInRands;
  if (input.retailPriceInRands !== undefined) {
    data.retailPriceCents = input.retailPriceInRands;
  }
  if (input.stock !== undefined) data.stock = input.stock;
  if (input.isActive !== undefined) data.isActive = input.isActive;
  if (input.comboCategoryId !== undefined) {
    data.comboCategoryId = input.comboCategoryId || null;
  }

  // If items are provided, replace all items
  if (input.items) {
    await db.comboItem.deleteMany({ where: { comboId } });
    await db.comboItem.createMany({
      data: input.items.map((item) => ({
        comboId,
        productId: item.productId || null,
        variantId: item.variantId || null,
        productName: item.productName,
        variantLabel: item.variantLabel || null,
        quantity: item.quantity,
      })),
    });
  }

  return db.combo.update({
    where: { id: comboId },
    data,
    include: {
      items: true,
      images: { orderBy: { position: "asc" } },
      comboCategory: true,
    },
  });
}

/** Delete a combo and all its items/images */
export async function deleteCombo(comboId: string, shopId: string) {
  const existing = await db.combo.findFirst({
    where: { id: comboId, shopId },
    include: { images: true },
  });
  if (!existing) return null;

  await db.combo.delete({ where: { id: comboId } });
  return existing;
}

/** Add an image to a combo */
export async function addComboImage(
  comboId: string,
  shopId: string,
  url: string,
  key?: string
) {
  // Verify combo belongs to shop
  const combo = await db.combo.findFirst({
    where: { id: comboId, shopId },
  });
  if (!combo) return null;

  const maxPos = await db.comboImage.aggregate({
    where: { comboId },
    _max: { position: true },
  });

  return db.comboImage.create({
    data: {
      comboId,
      url,
      key: key ?? null,
      position: (maxPos._max.position ?? -1) + 1,
    },
  });
}

/** Delete a combo image */
export async function deleteComboImage(imageId: string, comboId: string, shopId: string) {
  const combo = await db.combo.findFirst({
    where: { id: comboId, shopId },
  });
  if (!combo) return null;

  const image = await db.comboImage.findFirst({
    where: { id: imageId, comboId },
  });
  if (!image) return null;

  await db.comboImage.delete({ where: { id: imageId } });
  return image;
}

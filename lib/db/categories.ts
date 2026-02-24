// ============================================================
// Database Queries — Category CRUD
// ============================================================
// All category queries are scoped to a shopId.
// Slug is auto-generated from name.
// ============================================================

import { db } from "@/lib/db";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Get all categories for a shop, ordered by name */
export async function getCategories(shopId: string) {
  return db.category.findMany({
    where: { shopId },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { products: true } },
    },
  });
}

/** Get a single category by ID (scoped to shop) */
export async function getCategory(categoryId: string, shopId: string) {
  return db.category.findFirst({
    where: { id: categoryId, shopId },
    include: {
      _count: { select: { products: true } },
    },
  });
}

/** Create a category. Slug is auto-generated from name. */
export async function createCategory(shopId: string, name: string) {
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let counter = 1;

  // Ensure unique slug within shop
  while (true) {
    const existing = await db.category.findUnique({
      where: { shopId_slug: { shopId, slug } },
    });
    if (!existing) break;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return db.category.create({
    data: { name: name.trim(), slug, shopId },
    include: { _count: { select: { products: true } } },
  });
}

/** Update a category name (re-generates slug) */
export async function updateCategory(
  categoryId: string,
  shopId: string,
  name: string
) {
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let counter = 1;

  // Ensure unique slug within shop (excluding self)
  while (true) {
    const existing = await db.category.findFirst({
      where: { shopId, slug, NOT: { id: categoryId } },
    });
    if (!existing) break;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return db.category.update({
    where: { id: categoryId },
    data: { name: name.trim(), slug },
    include: { _count: { select: { products: true } } },
  });
}

/** Delete a category (products get categoryId set to null via onDelete: SetNull) */
export async function deleteCategory(categoryId: string, shopId: string) {
  // Verify ownership
  const cat = await db.category.findFirst({
    where: { id: categoryId, shopId },
  });
  if (!cat) return null;

  return db.category.delete({ where: { id: categoryId } });
}

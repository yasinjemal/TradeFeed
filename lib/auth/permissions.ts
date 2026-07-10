// ============================================================
// Role Permissions — Capability Matrix
// ============================================================
// Single source of truth for what each shop role may do.
// Server actions enforce these via requireShopAccess(slug, permission);
// dashboard UI reads the same matrix to hide controls a member
// cannot use. Never check `role === "..."` in an action directly —
// add a capability here instead so the matrix stays auditable.
//
// ROLES (prisma UserRole):
//   OWNER   — full access: billing, team, settings, delete shop
//   MANAGER — runs the shop day-to-day: catalog, orders, reviews, settings
//   STAFF   — fulfilment: view dashboard, update order status
// ============================================================

export type Permission =
  | "catalog:manage"   // products, categories, combos, drops, gallery, imports, images
  | "orders:update"    // order status changes, fulfilment notes
  | "orders:finance"   // confirm COD cash received, payment-side order actions
  | "reviews:moderate" // approve / reject / reply to reviews
  | "analytics:view"   // conversion and revenue performance
  | "customers:view"   // buyer contact details and marketing consent
  | "settings:manage"  // shop profile, payment options, notifications, preferences
  | "billing:manage"   // subscriptions, upgrades, promoted listings, domains, verification
  | "team:manage"      // invite, remove, change roles
  | "activity:view";   // shop activity log

export type ShopRole = "OWNER" | "MANAGER" | "STAFF";

const ROLE_PERMISSIONS: Record<ShopRole, ReadonlySet<Permission>> = {
  OWNER: new Set<Permission>([
    "catalog:manage",
    "orders:update",
    "orders:finance",
    "reviews:moderate",
    "analytics:view",
    "customers:view",
    "settings:manage",
    "billing:manage",
    "team:manage",
    "activity:view",
  ]),
  MANAGER: new Set<Permission>([
    "catalog:manage",
    "orders:update",
    "orders:finance",
    "reviews:moderate",
    "analytics:view",
    "customers:view",
    "settings:manage",
    "activity:view",
  ]),
  STAFF: new Set<Permission>(["orders:update"]),
};

/**
 * Check whether a role grants a capability.
 * Unknown roles (defensive: DB drift) get no permissions.
 */
export function hasPermission(role: string, permission: Permission): boolean {
  const grants = ROLE_PERMISSIONS[role as ShopRole];
  return grants ? grants.has(permission) : false;
}

/**
 * Buyer-facing copy for a denied capability — used by actions that
 * want a friendlier message than the generic "Access denied."
 */
export function permissionDeniedMessage(permission: Permission): string {
  switch (permission) {
    case "billing:manage":
      return "Only the shop owner can manage billing and upgrades.";
    case "team:manage":
      return "Only the shop owner can manage the team.";
    case "settings:manage":
      return "You don't have permission to change shop settings.";
    case "catalog:manage":
      return "You don't have permission to edit the catalog.";
    case "orders:finance":
      return "You don't have permission to confirm payments.";
    case "reviews:moderate":
      return "You don't have permission to moderate reviews.";
    default:
      return "You don't have permission to do this.";
  }
}

// ============================================================
// Config — Activity Log Actions
// ============================================================
// Defines all trackable actions and their human-readable
// message templates for the shop activity log system.
// ============================================================

export const ACTIVITY_ACTIONS = {
  // Team
  TEAM_MEMBER_INVITED: "TEAM_MEMBER_INVITED",
  TEAM_MEMBER_REMOVED: "TEAM_MEMBER_REMOVED",
  TEAM_MEMBER_ROLE_CHANGED: "TEAM_MEMBER_ROLE_CHANGED",
  TEAM_INVITE_ACCEPTED: "TEAM_INVITE_ACCEPTED",
  TEAM_INVITE_REVOKED: "TEAM_INVITE_REVOKED",

  // Products
  PRODUCT_CREATED: "PRODUCT_CREATED",
  PRODUCT_UPDATED: "PRODUCT_UPDATED",
  PRODUCT_DELETED: "PRODUCT_DELETED",

  // Orders
  ORDER_STATUS_CHANGED: "ORDER_STATUS_CHANGED",
} as const;

export type ActivityAction = (typeof ACTIVITY_ACTIONS)[keyof typeof ACTIVITY_ACTIONS];

export const ACTIVITY_ENTITY_TYPES = {
  TEAM_MEMBER: "TeamMember",
  PRODUCT: "Product",
  ORDER: "Order",
  INVITE: "Invite",
} as const;

export type ActivityEntityType =
  (typeof ACTIVITY_ENTITY_TYPES)[keyof typeof ACTIVITY_ENTITY_TYPES];

/**
 * Human-readable message templates for each action.
 * Placeholders: {user}, {entity}, {detail}
 */
export const ACTIVITY_MESSAGE_TEMPLATES: Record<ActivityAction, string> = {
  TEAM_MEMBER_INVITED: "{user} invited {entity} to the team",
  TEAM_MEMBER_REMOVED: "{user} removed {entity} from the team",
  TEAM_MEMBER_ROLE_CHANGED: "{user} changed {entity}'s role {detail}",
  TEAM_INVITE_ACCEPTED: "{user} accepted the team invitation",
  TEAM_INVITE_REVOKED: "{user} revoked the invitation for {entity}",
  PRODUCT_CREATED: "{user} created product {entity}",
  PRODUCT_UPDATED: "{user} updated product {entity}",
  PRODUCT_DELETED: "{user} deleted product {entity}",
  ORDER_STATUS_CHANGED: "{user} changed order {entity} status {detail}",
};

/**
 * Format an activity log entry into a human-readable message.
 */
export function formatActivityMessage(
  action: string,
  userName: string,
  entityName?: string | null,
  metadata?: Record<string, unknown> | null,
): string {
  const template =
    ACTIVITY_MESSAGE_TEMPLATES[action as ActivityAction] ??
    "{user} performed {action} on {entity}";

  let detail = "";
  if (metadata) {
    if (action === "ORDER_STATUS_CHANGED" && metadata.oldStatus && metadata.newStatus) {
      detail = `from ${metadata.oldStatus} to ${metadata.newStatus}`;
    }
    if (action === "TEAM_MEMBER_ROLE_CHANGED" && metadata.oldRole && metadata.newRole) {
      detail = `from ${metadata.oldRole} to ${metadata.newRole}`;
    }
    if (action === "PRODUCT_UPDATED" && metadata.oldPrice !== undefined && metadata.newPrice !== undefined) {
      detail = `(price: R${metadata.oldPrice} → R${metadata.newPrice})`;
    }
  }

  return template
    .replace("{user}", userName)
    .replace("{entity}", entityName || "unknown")
    .replace("{detail}", detail)
    .replace("{action}", action)
    .trim();
}

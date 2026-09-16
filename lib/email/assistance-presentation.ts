export function assistanceStatus(status: string) {
  const labels: Record<string, { label: string; detail: string }> = {
    PENDING: {
      label: "Queued",
      detail: "Approved. Waiting for the daily delivery check.",
    },
    PROCESSING: {
      label: "Checking delivery",
      detail:
        "A send attempt started. Do not resend while its outcome is checked.",
    },
    SENT: {
      label: "Sent to email provider",
      detail: "Accepted by the provider; delivery is not yet confirmed.",
    },
    DELIVERED: {
      label: "Delivered",
      detail:
        "The email provider confirmed delivery. This does not mean it was read.",
    },
    FAILED: {
      label: "Needs attention",
      detail:
        "Delivery is uncertain. Check the provider before attempting another send.",
    },
    BOUNCED: {
      label: "Could not deliver",
      detail:
        "The address bounced and is blocked from further assistance emails.",
    },
    COMPLAINED: {
      label: "Email stopped",
      detail:
        "The recipient reported this email. Further assistance emails are blocked.",
    },
    SUPPRESSED: {
      label: "Not sent / stopped",
      detail: "Eligibility changed or an address suppression applies.",
    },
    CANCELLED: {
      label: "Cancelled",
      detail: "The queued email was cancelled.",
    },
  };
  return (
    labels[status] ?? {
      label: "Status unavailable",
      detail: "Refresh or check delivery records before sending again.",
    }
  );
}
export function assistanceBlocker(blocker: string) {
  const labels: Record<string, string> = {
    hmac_secret_missing: "Email security setup is incomplete.",
    provider_not_ready: "The email provider needs setup or verification.",
    ncc_cleansing_missing_or_stale:
      "The required recipient-list screening needs updating.",
    customer_send_disabled: "Customer email sending is switched off.",
    assistance_send_disabled: "Seller assistance sending is switched off.",
    resend_webhook_secret_missing:
      "Delivery status reporting needs to be connected.",
  };
  return labels[blocker] ?? "A delivery setting needs attention.";
}
export function assistanceTitle(kind: string) {
  if (kind === "first_product") return "Help add a first product";
  if (kind === "incomplete_listing") return "Help complete a listing";
  if (kind === "share_catalogue") return "Help share the catalogue";
  return "Seller assistance";
}

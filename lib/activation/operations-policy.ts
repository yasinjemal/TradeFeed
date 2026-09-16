import { z } from "zod";

export const sellerFollowupSchema = z
  .object({
    shopId: z.string().min(1).max(100),
    status: z.enum(["IN_PROGRESS", "WAITING_SELLER", "CLOSED"]),
    nextAction: z.string().trim().min(10).max(500),
    evidence: z.string().trim().min(10).max(1500),
    enquiry: z.enum(["UNCONFIRMED", "SELLER_CONFIRMED"]),
    due: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .refine(
        (v) =>
          !Number.isNaN(Date.parse(v)) &&
          new Date(v).toISOString().slice(0, 10) === v,
        "Choose a valid follow-up date",
      ),
  })
  .refine((v) => v.enquiry !== "SELLER_CONFIRMED" || v.evidence.length >= 20, {
    message: "Describe the seller's confirmation",
    path: ["evidence"],
  });
export const orderFollowupSchema = z.object({
  orderId: z.string().min(1).max(100),
  outcome: z.enum([
    "AWAITING_SELLER",
    "SELLER_CONFIRMED_FULFILLED",
    "SELLER_CONFIRMED_CANCELLED",
    "UNRESOLVED",
  ]),
  evidence: z.string().trim().min(20).max(1500),
});
export function parseFollowup(details: string | null) {
  try {
    return sellerFollowupSchema.safeParse(JSON.parse(details ?? "{}"));
  } catch {
    return sellerFollowupSchema.safeParse({});
  }
}
export function orderFollowupSummary(details: string | null): string {
  try {
    const result = orderFollowupSchema.safeParse(JSON.parse(details ?? "{}"));
    return result.success
      ? `${result.data.outcome.replaceAll("_", " ")}: ${result.data.evidence}`
      : "Historical note could not be displayed.";
  } catch {
    return "Historical note could not be displayed.";
  }
}
export function sellerPriority(
  input: {
    createdAt: Date;
    ready: number;
    active: number;
    shopReady: boolean;
    shared: boolean;
    confirmedEnquiry: boolean;
  },
  now: Date,
) {
  if (
    input.ready >= 3 &&
    input.shopReady &&
    input.shared &&
    input.confirmedEnquiry
  )
    return 0;
  const recent = now.getTime() - input.createdAt.getTime() < 30 * 86400000;
  return (
    (recent ? 100 : 0) + (input.active === 0 ? 50 : input.ready < 3 ? 30 : 10)
  );
}

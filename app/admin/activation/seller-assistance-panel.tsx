import { requireAdmin } from "@/lib/auth/admin";
import { getSellerAssistanceReview } from "@/lib/db/seller-assistance";
import { SellerAssistanceView } from "@/components/admin/seller-assistance-view";
import {
  AssistanceControl,
  AssistanceRefresh,
} from "./seller-assistance-controls";

export async function SellerAssistancePanel() {
  await requireAdmin();
  const review = await getSellerAssistanceReview();
  return (
    <SellerAssistanceView
      review={review}
      refreshControl={<AssistanceRefresh />}
      approvalControls={Object.fromEntries(
        review.suggestions.map((item) => [
          `${item.userId}:${item.shopId}`,
          <AssistanceControl
            key={`${item.userId}:${item.shopId}`}
            approval={{
              userId: item.userId,
              shopId: item.shopId,
              fingerprint: item.fingerprint,
            }}
          />,
        ]),
      )}
      cancelControls={Object.fromEntries(
        review.history
          .filter((item) => item.status === "PENDING")
          .map((item) => [
            item.campaignId,
            <AssistanceControl
              key={item.campaignId}
              campaignId={item.campaignId}
            />,
          ]),
      )}
    />
  );
}

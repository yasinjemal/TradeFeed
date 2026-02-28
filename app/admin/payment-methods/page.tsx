// ============================================================
// Page — Admin Payment Methods (/admin/payment-methods)
// ============================================================
// CRUD for manual payment methods used in the upgrade flow.
// ============================================================

import { getAllPaymentMethods } from "@/lib/db/manual-payments";
import { PaymentMethodsManager } from "@/components/admin/payment-methods-manager";

export default async function AdminPaymentMethodsPage() {
  const methods = await getAllPaymentMethods();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-100">Payment Methods</h1>
        <p className="text-sm text-stone-400 mt-1">
          Configure manual payment options for seller upgrades. Sellers will see active methods when requesting a plan upgrade.
        </p>
      </div>

      <PaymentMethodsManager methods={methods} />
    </div>
  );
}

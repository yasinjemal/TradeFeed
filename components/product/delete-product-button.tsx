// ============================================================
// Component — Delete Product Button
// ============================================================
// Client component that calls deleteProductAction with confirm.
// Used on the product detail page in the Danger Zone section.
// ============================================================

"use client";

import { deleteProductAction } from "@/app/actions/product";
import { Button } from "@/components/ui/button";
import { useTransition } from "react";

interface DeleteProductButtonProps {
  shopSlug: string;
  productId: string;
}

export function DeleteProductButton({
  shopSlug,
  productId,
}: DeleteProductButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (
      !confirm(
        "Are you sure you want to delete this product? All variants and images will be permanently removed."
      )
    ) {
      return;
    }

    startTransition(async () => {
      await deleteProductAction(shopSlug, productId);
    });
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      disabled={isPending}
    >
      {isPending ? "Deleting…" : "Delete Product"}
    </Button>
  );
}

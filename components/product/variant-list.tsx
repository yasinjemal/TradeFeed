// ============================================================
// Component — Variant List
// ============================================================
// Displays all variants for a product in a table.
// Column headers use dynamic labels (option1Label / option2Label).
// ============================================================

"use client";

import { deleteVariantAction } from "@/app/actions/product";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatZAR } from "@/types";
import { useTransition } from "react";

interface Variant {
  id: string;
  size: string;
  color: string | null;
  priceInCents: number;
  stock: number;
  sku: string | null;
}

interface VariantListProps {
  variants: Variant[];
  shopSlug: string;
  productId: string;
  option1Label?: string;
  option2Label?: string;
}

export function VariantList({
  variants,
  shopSlug,
  productId,
  option1Label = "Size",
  option2Label = "Color",
}: VariantListProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete(variantId: string) {
    if (!confirm("Delete this option? This cannot be undone.")) return;

    startTransition(async () => {
      await deleteVariantAction(shopSlug, productId, variantId);
    });
  }

  if (variants.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="text-3xl mb-2">📏</div>
          <p className="text-sm text-muted-foreground">
            No options yet. Add {option1Label.toLowerCase()}s, {option2Label.toLowerCase()}s, and pricing below.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Sizes & Colors ({variants.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 font-medium">{option1Label}</th>
                <th className="pb-2 font-medium">{option2Label}</th>
                <th className="pb-2 font-medium">Price</th>
                <th className="pb-2 font-medium">Stock</th>
                <th className="pb-2 font-medium">SKU</th>
                <th className="pb-2 font-medium sr-only">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {variants.map((variant) => (
                <tr key={variant.id} className="group">
                  <td className="py-2 font-medium">{variant.size}</td>
                  <td className="py-2 text-muted-foreground">
                    {variant.color || "—"}
                  </td>
                  <td className="py-2 text-green-700 font-medium">
                    {formatZAR(variant.priceInCents)}
                  </td>
                  <td className="py-2">
                    <span
                      className={
                        variant.stock === 0
                          ? "text-red-600 font-medium"
                          : "text-foreground"
                      }
                    >
                      {variant.stock}
                    </span>
                  </td>
                  <td className="py-2 text-muted-foreground text-xs">
                    {variant.sku || "—"}
                  </td>
                  <td className="py-2 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDelete(variant.id)}
                      disabled={isPending}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

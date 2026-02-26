// ============================================================
// Component — Add Variant Form
// ============================================================
// Form to add a variant (option1+option2+price+stock) to a product.
// Labels are dynamic — read from product.option1Label / option2Label.
// Inline form on the product detail page.
//
// PRICE UX: Seller types in Rands (e.g. "299.99").
// Zod converts to cents (29999) server-side.
// ============================================================

"use client";

import { useActionState } from "react";
import { addVariantAction } from "@/app/actions/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AddVariantFormProps {
  shopSlug: string;
  productId: string;
  option1Label?: string;
  option2Label?: string;
}

export function AddVariantForm({
  shopSlug,
  productId,
  option1Label = "Size",
  option2Label = "Color",
}: AddVariantFormProps) {
  const boundAction = addVariantAction.bind(null, shopSlug, productId);
  const [state, formAction, isPending] = useActionState(boundAction, null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Add Variant</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {/* Error display */}
          {state?.error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {state.error}
            </div>
          )}

          {/* Success feedback */}
          {state?.success && (
            <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700">
              Variant added successfully!
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Option 1 — Required */}
            <div className="space-y-2">
              <Label htmlFor="size">{option1Label} *</Label>
              <Input
                id="size"
                name="size"
                placeholder={`e.g. ${option1Label === "Size" ? "S, M, L, XL, 32" : option1Label === "Storage" ? "64GB, 128GB, 256GB" : option1Label === "Weight" ? "250g, 500g, 1kg" : "Value"}`}
                required
                disabled={isPending}
              />
              {state?.fieldErrors?.size && (
                <p className="text-xs text-red-600">
                  {state.fieldErrors.size[0]}
                </p>
              )}
            </div>

            {/* Option 2 — Optional */}
            <div className="space-y-2">
              <Label htmlFor="color">
                {option2Label} <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="color"
                name="color"
                placeholder={`e.g. ${option2Label === "Color" ? "Red, Blue, Black" : option2Label === "Shade" ? "Light, Medium, Dark" : option2Label === "Flavor" ? "Original, BBQ, Chilli" : "Value"}`}
                disabled={isPending}
              />
              {state?.fieldErrors?.color && (
                <p className="text-xs text-red-600">
                  {state.fieldErrors.color[0]}
                </p>
              )}
            </div>

            {/* Price in Rands */}
            <div className="space-y-2">
              <Label htmlFor="priceInRands">Wholesale Price (ZAR) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  R
                </span>
                <Input
                  id="priceInRands"
                  name="priceInRands"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="299.99"
                  required
                  className="pl-7"
                  disabled={isPending}
                />
              </div>
              {state?.fieldErrors?.priceInRands && (
                <p className="text-xs text-red-600">
                  {state.fieldErrors.priceInRands[0]}
                </p>
              )}
            </div>

            {/* Retail Price (optional) */}
            <div className="space-y-2">
              <Label htmlFor="retailPriceInRands">Retail Price (ZAR) <span className="text-muted-foreground">(optional)</span></Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  R
                </span>
                <Input
                  id="retailPriceInRands"
                  name="retailPriceInRands"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="399.99"
                  className="pl-7"
                  disabled={isPending}
                />
              </div>
              {state?.fieldErrors?.retailPriceInRands && (
                <p className="text-xs text-red-600">
                  {state.fieldErrors.retailPriceInRands[0]}
                </p>
              )}
            </div>

            {/* Stock */}
            <div className="space-y-2">
              <Label htmlFor="stock">Stock *</Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                required
                disabled={isPending}
              />
              {state?.fieldErrors?.stock && (
                <p className="text-xs text-red-600">
                  {state.fieldErrors.stock[0]}
                </p>
              )}
            </div>
          </div>

          {/* SKU — Optional */}
          <div className="space-y-2">
            <Label htmlFor="sku">
              SKU <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="sku"
              name="sku"
              placeholder="Your internal reference code"
              disabled={isPending}
            />
          </div>

          <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
            {isPending ? "Adding..." : "Add Variant"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

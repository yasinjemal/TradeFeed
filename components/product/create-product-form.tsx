// ============================================================
// Component — Create Product Form
// ============================================================
// Form for creating a new product. After creation, redirects to
// the product detail page where variants can be added.
//
// RULES:
// - No business logic here — all validation happens server-side
// - Uses useActionState for server action integration
// - Mobile-first layout
// ============================================================

"use client";

import { useActionState } from "react";
import { createProductAction } from "@/app/actions/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface CreateProductFormProps {
  shopSlug: string;
}

export function CreateProductForm({ shopSlug }: CreateProductFormProps) {
  // Bind the shopSlug to the action so the form doesn't need to send it
  const boundAction = createProductAction.bind(null, shopSlug);
  const [state, formAction, isPending] = useActionState(boundAction, null);

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Add New Product</CardTitle>
        <CardDescription>
          Create a product, then add size variants with pricing and stock.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form action={formAction} className="space-y-4">
          {/* General error */}
          {state?.error && !state.fieldErrors && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {state.error}
            </div>
          )}

          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. Floral Summer Dress"
              required
              minLength={2}
              maxLength={200}
              disabled={isPending}
            />
            {state?.fieldErrors?.name && (
              <p className="text-sm text-red-600">
                {state.fieldErrors.name[0]}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description{" "}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe the product — material, fit, style..."
              maxLength={2000}
              rows={3}
              disabled={isPending}
            />
            {state?.fieldErrors?.description && (
              <p className="text-sm text-red-600">
                {state.fieldErrors.description[0]}
              </p>
            )}
          </div>

          {/* Active Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              defaultChecked={true}
              className="h-4 w-4 rounded border-gray-300"
              disabled={isPending}
            />
            <Label htmlFor="isActive" className="text-sm font-normal">
              Show on public catalog
            </Label>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isPending}
          >
            {isPending ? "Creating..." : "Create Product"}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            After creating, you&apos;ll add size variants with pricing.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Component — Create Shop Form
// ============================================================
// Mobile-first form for creating a new shop.
// Uses shadcn/ui components + React useActionState for server action.
//
// RULES:
// - No business logic in this component
// - Validation happens server-side (Zod in the action)
// - This is a presentational component that calls a server action
// - Shows field-level errors returned from the server
// ============================================================

"use client";

import { useActionState } from "react";
import { createShopAction } from "@/app/actions/shop";
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

export function CreateShopForm() {
  // useActionState handles form submission + pending state
  // WHY: Built-in React pattern for server actions. Handles loading,
  // error display, and progressive enhancement (works without JS).
  const [state, formAction, isPending] = useActionState(
    createShopAction,
    null
  );

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Create Your Shop</CardTitle>
        <CardDescription>
          Set up your digital catalog in under 2 minutes.
          <br />
          Your shop link will be shareable on WhatsApp.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form action={formAction} className="space-y-4">
          {/* ---- General error message ---- */}
          {state?.error && !state.fieldErrors && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {state.error}
            </div>
          )}

          {/* ---- Shop Name ---- */}
          <div className="space-y-2">
            <Label htmlFor="name">Shop Name *</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. Marble Tower Fashions"
              required
              minLength={2}
              maxLength={100}
              disabled={isPending}
              aria-describedby={
                state?.fieldErrors?.name ? "name-error" : undefined
              }
            />
            {state?.fieldErrors?.name && (
              <p id="name-error" className="text-sm text-red-600">
                {state.fieldErrors.name[0]}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              This will be displayed on your public catalog page.
            </p>
          </div>

          {/* ---- WhatsApp Number ---- */}
          <div className="space-y-2">
            <Label htmlFor="whatsappNumber">WhatsApp Number *</Label>
            <Input
              id="whatsappNumber"
              name="whatsappNumber"
              type="tel"
              placeholder="e.g. 071 234 5678"
              required
              disabled={isPending}
              aria-describedby={
                state?.fieldErrors?.whatsappNumber
                  ? "whatsapp-error"
                  : undefined
              }
            />
            {state?.fieldErrors?.whatsappNumber && (
              <p id="whatsapp-error" className="text-sm text-red-600">
                {state.fieldErrors.whatsappNumber[0]}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Buyers will send orders to this number via WhatsApp.
            </p>
          </div>

          {/* ---- Description (optional) ---- */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description{" "}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Tell buyers what you sell..."
              maxLength={500}
              rows={3}
              disabled={isPending}
              aria-describedby={
                state?.fieldErrors?.description
                  ? "description-error"
                  : undefined
              }
            />
            {state?.fieldErrors?.description && (
              <p id="description-error" className="text-sm text-red-600">
                {state.fieldErrors.description[0]}
              </p>
            )}
          </div>

          {/* ---- Submit Button ---- */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isPending}
          >
            {isPending ? "Creating shop..." : "Create Shop"}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            You can update these details later from your dashboard.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

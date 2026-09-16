"use client";
import { useActionState } from "react";
import { createSupportCaseAction } from "@/app/actions/support-cases";
export function CaseForm({ orderNumber = "" }: { orderNumber?: string }) {
  const [state, action, pending] = useActionState(createSupportCaseAction, {});
  const input =
    "mt-1 block w-full rounded-lg border border-tf-stone-300 bg-tf-raised px-3 py-3";
  return (
    <form action={action} className="space-y-5">
      <label className="block">
        Order number
        <input
          className={input}
          name="orderNumber"
          defaultValue={orderNumber}
          required
          maxLength={80}
        />
      </label>
      <label className="block">
        Phone number used at checkout
        <input
          className={input}
          type="tel"
          name="phone"
          autoComplete="tel"
          maxLength={30}
        />
        <span className="text-sm text-tf-stone-600">
          Not needed when signed in to the account that placed this order.
        </span>
      </label>
      <label className="block">
        What do you need help with?
        <select className={input} name="category">
          <option value="DELIVERY">Delivery or missing order</option>
          <option value="RETURN">Return or refund</option>
          <option value="DAMAGED_ITEM">Damaged or incorrect item</option>
          <option value="PAYMENT">Payment</option>
          <option value="CANCELLATION">Cancellation</option>
          <option value="OTHER">Something else</option>
        </select>
      </label>
      <label className="block">
        Tell us what happened
        <textarea
          className={input}
          name="body"
          rows={5}
          required
          minLength={10}
          maxLength={4000}
        />
      </label>
      <p className="text-sm text-tf-stone-600">
        Your request is shared with the shop and TradeFeed support. Do not
        include card details or passwords. A request does not automatically
        cancel an order or issue a refund.
      </p>
      {state.error && (
        <p role="alert" className="text-red-700">
          {state.error}
        </p>
      )}
      <button
        disabled={pending}
        className="min-h-11 rounded-lg bg-tf-primary px-6 py-3 font-semibold text-white disabled:opacity-50"
      >
        {pending ? "Submitting…" : "Open support case"}
      </button>
    </form>
  );
}

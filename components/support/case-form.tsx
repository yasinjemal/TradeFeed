"use client";
import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { createSupportCaseAction } from "@/app/actions/support-cases";
export function CaseForm({ orderNumber = "" }: { orderNumber?: string }) {
  const [details, setDetails] = useState({orderNumber, phone: "", category: "DELIVERY", body: ""});
  const [state, action, pending] = useActionState(createSupportCaseAction, {});
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const input =
    "mt-1 block w-full rounded-lg border border-tf-stone-300 bg-tf-raised px-3 py-3";
  return (
    <form action={action} className="space-y-5">
      <fieldset disabled={!ready || pending} className="space-y-5">
      <div className="rounded-xl border border-tf-stone-200 bg-tf-surface p-4 text-sm text-tf-stone-600">
        <p className="font-semibold text-tf-ink">No order number or checkout phone?</p>
        <p className="mt-1">If you contacted the seller directly on WhatsApp, or checked out without a phone number, our team can help you find the right next step.</p>
        <Link href="/contact" className="mt-2 inline-flex min-h-11 items-center font-semibold text-tf-primary underline">Get help without an order number</Link>
      </div>
      <label className="block">
        Order number
        <input
          className={input}
          name="orderNumber"
          value={details.orderNumber}
          onChange={e => setDetails({...details, orderNumber: e.target.value})}
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
          value={details.phone}
          onChange={e => setDetails({...details, phone: e.target.value})}
          autoComplete="tel"
          maxLength={30}
        />
        <span className="text-sm text-tf-stone-600">
          Not needed on the browser used for a recent checkout, or when signed in to the account that placed this order.
        </span>
      </label>
      <label className="block">
        What do you need help with?
        <select className={input} name="category" value={details.category} onChange={e => setDetails({...details, category: e.target.value})}>
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
          value={details.body}
          onChange={e => setDetails({...details, body: e.target.value})}
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
      </fieldset>
    </form>
  );
}

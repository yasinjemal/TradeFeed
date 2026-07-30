"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, MessageCircle } from "lucide-react";

import { TfButton } from "@/components/tf/button";
import {
  buildGrowthApplicationWhatsAppUrl,
  type GrowthApplicationInput,
} from "@/lib/growth/application";

const inputClassName =
  "mt-2 min-h-12 w-full rounded-xl border border-tf-stone-300 bg-tf-raised px-3.5 py-2.5 text-[15px] text-tf-ink shadow-tf-sm outline-none transition placeholder:text-tf-stone-400 focus:border-tf-primary focus:ring-2 focus:ring-tf-primary/20";

const labelClassName = "block text-sm font-semibold text-tf-stone-800";

function formValue(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "");
}

export function GrowthApplicationForm() {
  const [opened, setOpened] = React.useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    if (!form.reportValidity()) return;

    const formData = new FormData(form);
    const application: GrowthApplicationInput = {
      businessName: formValue(formData, "businessName"),
      ownerName: formValue(formData, "ownerName"),
      applicantWhatsApp: formValue(formData, "applicantWhatsApp"),
      productType: formValue(formData, "productType"),
      productCount: formValue(formData, "productCount"),
      salesChannel: formValue(formData, "salesChannel"),
      photoReadiness: formValue(formData, "photoReadiness"),
      serviceInterest: formValue(formData, "serviceInterest"),
      launchTimeline: formValue(formData, "launchTimeline"),
      challenge: formValue(formData, "challenge"),
    };

    const url = buildGrowthApplicationWhatsAppUrl(application);
    setOpened(true);

    const newWindow = window.open(url, "_blank");
    if (newWindow) {
      newWindow.opener = null;
    } else {
      window.location.assign(url);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-tf-stone-200 bg-tf-raised p-5 shadow-tf-md sm:p-7"
    >
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-tf-primary">
          Two-minute fit check
        </p>
        <h3 className="mt-2 font-tf-display text-2xl font-semibold tracking-tight text-tf-ink">
          Tell us about your shop
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-tf-stone-600">
          We&apos;ll prepare a WhatsApp message from your answers. Review it,
          tap send, and we&apos;ll reply within one business day.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className={labelClassName}>
          Business name
          <input
            className={inputClassName}
            name="businessName"
            autoComplete="organization"
            maxLength={120}
            placeholder="e.g. Lerato Beauty Supply"
            required
          />
        </label>

        <label className={labelClassName}>
          Your name
          <input
            className={inputClassName}
            name="ownerName"
            autoComplete="name"
            maxLength={100}
            placeholder="Name we should use"
            required
          />
        </label>

        <label className={labelClassName}>
          Your WhatsApp number
          <input
            className={inputClassName}
            name="applicantWhatsApp"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={24}
            placeholder="+27 82 123 4567"
            required
          />
        </label>

        <label className={labelClassName}>
          What do you sell?
          <input
            className={inputClassName}
            name="productType"
            maxLength={120}
            placeholder="Clothing, beauty, phones..."
            required
          />
        </label>

        <label className={labelClassName}>
          Roughly how many products?
          <select className={inputClassName} name="productCount" required defaultValue="">
            <option value="" disabled>
              Choose a range
            </option>
            <option>1–20</option>
            <option>21–50</option>
            <option>51–100</option>
            <option>101–300</option>
            <option>More than 300</option>
            <option>Not sure yet</option>
          </select>
        </label>

        <label className={labelClassName}>
          Where do you sell now?
          <select className={inputClassName} name="salesChannel" required defaultValue="">
            <option value="" disabled>
              Choose your main channel
            </option>
            <option>WhatsApp only</option>
            <option>WhatsApp and social media</option>
            <option>Physical shop or showroom</option>
            <option>Existing website or marketplace</option>
            <option>More than one of these</option>
          </select>
        </label>

        <label className={labelClassName}>
          Are product photos ready?
          <select className={inputClassName} name="photoReadiness" required defaultValue="">
            <option value="" disabled>
              Choose one
            </option>
            <option>Yes, for most products</option>
            <option>Some photos are ready</option>
            <option>I need help taking them</option>
            <option>Not sure what is usable</option>
          </select>
        </label>

        <label className={labelClassName}>
          Which service interests you?
          <select className={inputClassName} name="serviceInterest" required defaultValue="">
            <option value="" disabled>
              Choose a service
            </option>
            <option>Shop Launch — R5,000 founding offer</option>
            <option>Growth Management — R3,500/month</option>
            <option>Wholesale Digital Setup — from R15,000</option>
            <option>Not sure — recommend one</option>
          </select>
        </label>

        <label className={labelClassName}>
          When would you like to start?
          <select className={inputClassName} name="launchTimeline" required defaultValue="">
            <option value="" disabled>
              Choose a timeframe
            </option>
            <option>As soon as possible</option>
            <option>Within two weeks</option>
            <option>Within a month</option>
            <option>I am only exploring</option>
          </select>
        </label>

        <label className={`${labelClassName} sm:col-span-2`}>
          What is the biggest problem right now?
          <textarea
            className={`${inputClassName} min-h-28 resize-y`}
            name="challenge"
            maxLength={500}
            placeholder="For example: uploading products takes too long, customers keep asking for prices, or I do not post consistently."
            required
          />
        </label>
      </div>

      <div className="mt-5 rounded-xl border border-tf-stone-200 bg-tf-stone-50 p-4">
        <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-tf-stone-700">
          <input
            type="checkbox"
            name="contactPermission"
            required
            className="mt-1 size-4 shrink-0 accent-emerald-700"
          />
          <span>
            TradeFeed may contact me on WhatsApp about this application. This
            is not consent to unrelated marketing.
          </span>
        </label>
        <p className="mt-3 text-xs leading-relaxed text-tf-stone-500">
          Do not include passwords, one-time codes, bank or card details,
          customer information, or private WhatsApp messages. Read our{" "}
          <Link href="/privacy" className="font-medium text-tf-primary underline underline-offset-2">
            Privacy Policy
          </Link>
          .
        </p>
      </div>

      <TfButton type="submit" variant="whatsapp" size="lg" fullWidth className="mt-5">
        <MessageCircle aria-hidden="true" />
        Review and send on WhatsApp
      </TfButton>

      <p className="mt-3 text-center text-xs leading-relaxed text-tf-stone-500">
        Nothing is sent from this page. WhatsApp opens with your answers and
        you choose whether to send them.
      </p>

      {opened && (
        <div
          className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900"
          role="status"
          aria-live="polite"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          WhatsApp opened with your application. Review the message and tap
          Send so we can receive it.
        </div>
      )}
    </form>
  );
}

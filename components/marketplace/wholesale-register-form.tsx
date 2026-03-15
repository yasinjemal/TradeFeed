"use client";

import { useActionState, useState } from "react";
import { registerWholesaleBuyerAction, checkWholesaleStatusAction } from "@/app/actions/wholesale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SA_PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
] as const;

export function WholesaleRegisterForm() {
  const [state, formAction, isPending] = useActionState(registerWholesaleBuyerAction, null);
  const [mode, setMode] = useState<"register" | "check">("register");
  const [checkPhone, setCheckPhone] = useState("");
  const [checkResult, setCheckResult] = useState<{
    found: boolean;
    status?: string;
    businessName?: string;
    rejectedReason?: string | null;
  } | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const handleCheckStatus = async () => {
    if (!checkPhone.trim()) return;
    setIsChecking(true);
    const result = await checkWholesaleStatusAction(checkPhone.trim());
    setCheckResult(result);
    setIsChecking(false);
  };

  if (state?.success) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="text-5xl">✅</div>
        <h2 className="text-xl font-bold text-white">Application Submitted!</h2>
        <p className="text-stone-400 text-sm max-w-sm mx-auto">
          Your wholesale buyer application is under review. We&apos;ll notify you
          via WhatsApp within 24-48 hours.
        </p>
        <button
          onClick={() => setMode("check")}
          className="text-sm text-amber-400 hover:text-amber-300 underline underline-offset-2"
        >
          Check application status
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="flex gap-2 rounded-lg bg-stone-800/50 p-1">
        <button
          onClick={() => setMode("register")}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            mode === "register"
              ? "bg-amber-500 text-white"
              : "text-stone-400 hover:text-white"
          }`}
        >
          Register
        </button>
        <button
          onClick={() => setMode("check")}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            mode === "check"
              ? "bg-amber-500 text-white"
              : "text-stone-400 hover:text-white"
          }`}
        >
          Check Status
        </button>
      </div>

      {mode === "check" ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm text-stone-300">WhatsApp Number</Label>
            <Input
              value={checkPhone}
              onChange={(e) => setCheckPhone(e.target.value)}
              placeholder="+27612345678"
              className="bg-stone-800 border-stone-700 text-white placeholder:text-stone-500"
            />
          </div>
          <Button
            onClick={handleCheckStatus}
            disabled={isChecking || !checkPhone.trim()}
            className="w-full bg-amber-500 hover:bg-amber-600"
          >
            {isChecking ? "Checking..." : "Check Status"}
          </Button>

          {checkResult && (
            <div className={`rounded-lg border p-4 ${
              checkResult.found
                ? checkResult.status === "VERIFIED"
                  ? "border-emerald-500/30 bg-emerald-950/30"
                  : checkResult.status === "PENDING"
                    ? "border-amber-500/30 bg-amber-950/30"
                    : "border-red-500/30 bg-red-950/30"
                : "border-stone-700 bg-stone-800/50"
            }`}>
              {!checkResult.found ? (
                <p className="text-stone-400 text-sm">
                  No application found for this number.{" "}
                  <button
                    onClick={() => setMode("register")}
                    className="text-amber-400 underline"
                  >
                    Register now
                  </button>
                </p>
              ) : (
                <div className="space-y-1">
                  <p className="text-white font-medium text-sm">
                    {checkResult.businessName}
                  </p>
                  <p className={`text-sm font-semibold ${
                    checkResult.status === "VERIFIED"
                      ? "text-emerald-400"
                      : checkResult.status === "PENDING"
                        ? "text-amber-400"
                        : "text-red-400"
                  }`}>
                    Status: {checkResult.status}
                  </p>
                  {checkResult.rejectedReason && (
                    <p className="text-xs text-red-300 mt-1">
                      Reason: {checkResult.rejectedReason}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <form action={formAction} className="space-y-5">
          {state?.error && (
            <div className="rounded-lg bg-red-950/50 border border-red-500/30 px-4 py-3 text-sm text-red-300">
              ⚠️ {state.error}
            </div>
          )}

          {/* Phone (required) */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm text-stone-300">
              WhatsApp Number <span className="text-red-400">*</span>
            </Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+27612345678"
              required
              disabled={isPending}
              className="bg-stone-800 border-stone-700 text-white placeholder:text-stone-500"
            />
            {state?.fieldErrors?.phone && (
              <p className="text-xs text-red-400">{state.fieldErrors.phone[0]}</p>
            )}
          </div>

          {/* Business Name (required) */}
          <div className="space-y-2">
            <Label htmlFor="businessName" className="text-sm text-stone-300">
              Business Name <span className="text-red-400">*</span>
            </Label>
            <Input
              id="businessName"
              name="businessName"
              placeholder="e.g. Johannesburg Fashion Traders"
              required
              disabled={isPending}
              className="bg-stone-800 border-stone-700 text-white placeholder:text-stone-500"
            />
            {state?.fieldErrors?.businessName && (
              <p className="text-xs text-red-400">{state.fieldErrors.businessName[0]}</p>
            )}
          </div>

          {/* Contact Name (required) */}
          <div className="space-y-2">
            <Label htmlFor="contactName" className="text-sm text-stone-300">
              Contact Person <span className="text-red-400">*</span>
            </Label>
            <Input
              id="contactName"
              name="contactName"
              placeholder="Your full name"
              required
              disabled={isPending}
              className="bg-stone-800 border-stone-700 text-white placeholder:text-stone-500"
            />
            {state?.fieldErrors?.contactName && (
              <p className="text-xs text-red-400">{state.fieldErrors.contactName[0]}</p>
            )}
          </div>

          {/* Email (optional) */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm text-stone-300">
              Business Email <span className="text-stone-500">(optional)</span>
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="orders@yourbusiness.co.za"
              disabled={isPending}
              className="bg-stone-800 border-stone-700 text-white placeholder:text-stone-500"
            />
            {state?.fieldErrors?.email && (
              <p className="text-xs text-red-400">{state.fieldErrors.email[0]}</p>
            )}
          </div>

          {/* VAT + Registration Number (optional, side by side) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vatNumber" className="text-sm text-stone-300">
                VAT Number <span className="text-stone-500">(optional)</span>
              </Label>
              <Input
                id="vatNumber"
                name="vatNumber"
                placeholder="e.g. 4012345678"
                disabled={isPending}
                className="bg-stone-800 border-stone-700 text-white placeholder:text-stone-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registrationNumber" className="text-sm text-stone-300">
                CIPC Reg No. <span className="text-stone-500">(optional)</span>
              </Label>
              <Input
                id="registrationNumber"
                name="registrationNumber"
                placeholder="e.g. 2024/012345/07"
                disabled={isPending}
                className="bg-stone-800 border-stone-700 text-white placeholder:text-stone-500"
              />
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city" className="text-sm text-stone-300">
                City <span className="text-stone-500">(optional)</span>
              </Label>
              <Input
                id="city"
                name="city"
                placeholder="e.g. Johannesburg"
                disabled={isPending}
                className="bg-stone-800 border-stone-700 text-white placeholder:text-stone-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="province" className="text-sm text-stone-300">
                Province <span className="text-stone-500">(optional)</span>
              </Label>
              <select
                id="province"
                name="province"
                disabled={isPending}
                className="flex h-10 w-full rounded-md border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none disabled:opacity-50"
                defaultValue=""
              >
                <option value="">Select province</option>
                {SA_PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-amber-500 hover:bg-amber-600 h-12 text-base font-semibold"
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </span>
            ) : (
              "Submit Application"
            )}
          </Button>
        </form>
      )}
    </div>
  );
}

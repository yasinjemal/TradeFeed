"use client";

import { FormEvent, useState, useTransition } from "react";
import Link from "next/link";
import { Bell, Check, MapPin, Pencil, Plus, ShieldCheck, Trash2, UserRound } from "lucide-react";

import {
  createBuyerAddressAction,
  deleteBuyerAddressAction,
  setDefaultBuyerAddressAction,
  updateBuyerAddressAction,
  updateBuyerProfileAction,
} from "@/app/actions/buyer-account";
import { updateBuyerNotificationPreferencesAction } from "@/app/actions/buyer-notifications";
import { BUYER_LANGUAGES, SA_PROVINCES, type BuyerAddressInput } from "@/lib/validation/buyer-account";

type Address = Omit<BuyerAddressInput, "phone" | "addressLine2" | "deliveryInstructions" | "province"> & { id: string; phone: string | null; addressLine2: string | null; deliveryInstructions: string | null; province: string; createdAt: Date | string; updatedAt: Date | string };
type Preferences = { orderUpdates: boolean; restockAlerts: boolean; shopUpdates: boolean };
type Profile = Preferences & { displayName: string | null; phone: string | null; language: string };

const languageLabels: Record<(typeof BUYER_LANGUAGES)[number], string> = { en: "English", zu: "isiZulu", xh: "isiXhosa", af: "Afrikaans", st: "Sesotho" };
const emptyAddress: BuyerAddressInput = { label: "Home", recipientName: "", phone: "", addressLine1: "", addressLine2: "", city: "", province: "Gauteng", postalCode: "", deliveryInstructions: "", isDefault: false };

export function BuyerAccountManager({ profile, initialAddresses }: { profile: Profile; initialAddresses: Address[] }) {
  const [name, setName] = useState(profile.displayName ?? "");
  const [language, setLanguage] = useState(profile.language as (typeof BUYER_LANGUAGES)[number]);
  const [preferences, setPreferences] = useState<Preferences>(profile);
  const [addresses, setAddresses] = useState(initialAddresses);
  const [editing, setEditing] = useState<Address | "new" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function saveProfile(event: FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateBuyerProfileAction({ displayName: name, language });
      result.success ? setNotice("Personal details saved.") : setError(result.error ?? "Could not save your profile.");
    });
  }

  function savePreferences(next: Preferences) {
    setPreferences(next);
    setError(null);
    startTransition(async () => {
      const result = await updateBuyerNotificationPreferencesAction(next);
      if (!result.success) {
        setPreferences(preferences);
        setError("Could not update notification preferences.");
      }
    });
  }

  function makeDefault(addressId: string) {
    const previous = addresses;
    setAddresses((current) => current.map((address) => ({ ...address, isDefault: address.id === addressId })));
    startTransition(async () => {
      const result = await setDefaultBuyerAddressAction(addressId);
      if (!result.success) { setAddresses(previous); setError(result.error ?? "Could not update the default address."); }
    });
  }

  function removeAddress(addressId: string) {
    if (!window.confirm("Remove this saved address?")) return;
    const previous = addresses;
    const removed = addresses.find((address) => address.id === addressId);
    const remaining = addresses.filter((address) => address.id !== addressId);
    if (removed?.isDefault && remaining[0]) remaining[0] = { ...remaining[0], isDefault: true };
    setAddresses(remaining);
    startTransition(async () => {
      const result = await deleteBuyerAddressAction(addressId);
      if (!result.success) { setAddresses(previous); setError(result.error ?? "Could not remove the address."); }
    });
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-extrabold">Account</h1><p className="mt-1 text-sm text-stone-400">Your identity, delivery details, and communication choices.</p></div>
      {(notice || error) && <div className={`rounded-xl border px-4 py-3 text-sm ${error ? "border-red-500/20 bg-red-500/10 text-red-300" : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"}`}>{error ?? notice}</div>}

      <section className="rounded-2xl border border-stone-800/60 bg-stone-900/40 p-5">
        <div className="mb-5 flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400"><UserRound className="size-5" /></div><div><h2 className="font-semibold">Personal details</h2><p className="text-xs text-stone-500">Used on orders and account screens.</p></div></div>
        <form onSubmit={saveProfile} className="grid gap-4 sm:grid-cols-2">
          <Field label="Display name"><input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} className={inputClass} /></Field>
          <Field label="Preferred language"><select value={language} onChange={(event) => setLanguage(event.target.value as typeof language)} className={inputClass}>{BUYER_LANGUAGES.map((code) => <option key={code} value={code}>{languageLabels[code]}</option>)}</select></Field>
          <Field label="Verified phone"><div className={`${inputClass} flex items-center justify-between text-stone-400`}><span>{profile.phone ?? "Not linked"}</span>{profile.phone && <span className="text-[10px] font-semibold text-emerald-400">VERIFIED</span>}</div></Field>
          <div className="flex items-end"><button type="submit" disabled={isPending} className="h-11 w-full rounded-xl bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50">Save details</button></div>
        </form>
      </section>

      <section className="rounded-2xl border border-stone-800/60 bg-stone-900/40 p-5">
        <div className="mb-5 flex items-center justify-between gap-3"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400"><MapPin className="size-5" /></div><div><h2 className="font-semibold">Saved addresses</h2><p className="text-xs text-stone-500">Keep up to 10 delivery destinations.</p></div></div><button type="button" onClick={() => setEditing("new")} disabled={addresses.length >= 10} className="inline-flex items-center gap-1.5 rounded-xl border border-stone-700 px-3 py-2 text-xs font-semibold text-stone-300 hover:bg-stone-800 disabled:opacity-40"><Plus className="size-3.5" />Add</button></div>
        {addresses.length === 0 ? <button type="button" onClick={() => setEditing("new")} className="w-full rounded-xl border border-dashed border-stone-700 px-4 py-8 text-center text-sm text-stone-500 hover:border-emerald-500/40 hover:text-stone-300">Add your first delivery address</button> : <div className="grid gap-3 sm:grid-cols-2">{addresses.map((address) => <AddressCard key={address.id} address={address} onEdit={() => setEditing(address)} onDefault={() => makeDefault(address.id)} onDelete={() => removeAddress(address.id)} />)}</div>}
      </section>

      <section className="rounded-2xl border border-stone-800/60 bg-stone-900/40 p-5">
        <div className="mb-4 flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400"><Bell className="size-5" /></div><div><h2 className="font-semibold">Notification controls</h2><p className="text-xs text-stone-500">Choose the updates that matter to you.</p></div></div>
        <div className="divide-y divide-stone-800"><Preference title="Order updates" detail="Confirmation, dispatch, delivery and collection." checked={preferences.orderUpdates} disabled={isPending} onChange={(checked) => savePreferences({ ...preferences, orderUpdates: checked })} /><Preference title="Back in stock" detail="Alerts for products you saved." checked={preferences.restockAlerts} disabled={isPending} onChange={(checked) => savePreferences({ ...preferences, restockAlerts: checked })} /><Preference title="Followed shop drops" detail="New arrivals from shops you follow." checked={preferences.shopUpdates} disabled={isPending} onChange={(checked) => savePreferences({ ...preferences, shopUpdates: checked })} /></div>
      </section>

      <Link href="/me/security" className="flex items-center justify-between rounded-2xl border border-stone-800/60 bg-stone-900/40 p-5 transition hover:border-emerald-500/30"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400"><ShieldCheck className="size-5" /></div><div><p className="font-semibold">Security and sign-in</p><p className="text-xs text-stone-500">Manage passwords, connected accounts, and sessions.</p></div></div><span className="text-stone-600">→</span></Link>

      {editing && <AddressEditor address={editing === "new" ? null : editing} onCancel={() => setEditing(null)} onSaved={(address) => { setAddresses((current) => { const without = current.filter((item) => item.id !== address.id); const next = address.isDefault ? without.map((item) => ({ ...item, isDefault: false })) : without; return [address, ...next].sort((a, b) => Number(b.isDefault) - Number(a.isDefault)); }); setEditing(null); setNotice("Address saved."); }} />}
    </div>
  );
}

const inputClass = "h-11 w-full rounded-xl border border-stone-700 bg-stone-950 px-3 text-sm text-stone-100 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15";
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="space-y-1.5"><span className="text-xs font-medium text-stone-400">{label}</span>{children}</label>; }
function Preference({ title, detail, checked, disabled, onChange }: { title: string; detail: string; checked: boolean; disabled: boolean; onChange: (checked: boolean) => void }) { return <div className="flex items-center justify-between gap-3 py-3"><div><p className="text-sm font-medium text-stone-200">{title}</p><p className="text-xs text-stone-500">{detail}</p></div><button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)} className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-emerald-600" : "bg-stone-700"}`}><span className={`absolute top-0.5 size-5 rounded-full bg-white transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} /></button></div>; }

function AddressCard({ address, onEdit, onDefault, onDelete }: { address: Address; onEdit: () => void; onDefault: () => void; onDelete: () => void }) { return <div className={`rounded-xl border p-4 ${address.isDefault ? "border-emerald-500/30 bg-emerald-500/5" : "border-stone-800 bg-stone-950/40"}`}><div className="flex items-start justify-between gap-2"><div><div className="flex items-center gap-2"><p className="text-sm font-semibold">{address.label}</p>{address.isDefault && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">DEFAULT</span>}</div><p className="mt-2 text-xs font-medium text-stone-300">{address.recipientName}</p><p className="mt-1 text-xs leading-relaxed text-stone-500">{address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ""}<br />{address.city}, {address.province}, {address.postalCode}</p></div><div className="flex gap-1"><button type="button" onClick={onEdit} className="rounded-lg p-2 text-stone-500 hover:bg-stone-800 hover:text-stone-300" aria-label={`Edit ${address.label}`}><Pencil className="size-3.5" /></button><button type="button" onClick={onDelete} className="rounded-lg p-2 text-stone-500 hover:bg-red-500/10 hover:text-red-400" aria-label={`Delete ${address.label}`}><Trash2 className="size-3.5" /></button></div></div>{!address.isDefault && <button type="button" onClick={onDefault} className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400"><Check className="size-3" />Make default</button>}</div>; }

function AddressEditor({ address, onCancel, onSaved }: { address: Address | null; onCancel: () => void; onSaved: (address: Address) => void }) {
  const [form, setForm] = useState<BuyerAddressInput>(address ? { ...address, province: address.province as BuyerAddressInput["province"], phone: address.phone ?? "", addressLine2: address.addressLine2 ?? "", deliveryInstructions: address.deliveryInstructions ?? "" } : emptyAddress); const [error, setError] = useState<string | null>(null); const [isPending, startTransition] = useTransition();
  const set = <K extends keyof BuyerAddressInput>(key: K, value: BuyerAddressInput[K]) => setForm((current) => ({ ...current, [key]: value }));
  function submit(event: FormEvent) { event.preventDefault(); setError(null); startTransition(async () => { const result = address ? await updateBuyerAddressAction(address.id, form) : await createBuyerAddressAction(form); if (!result.success || !result.address) { setError(result.error ?? "Could not save the address."); return; } onSaved(result.address as Address); }); }
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-5"><div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-stone-800 bg-stone-900 p-5 shadow-2xl sm:rounded-3xl"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-lg font-bold">{address ? "Edit address" : "Add delivery address"}</h2><p className="text-xs text-stone-500">Only you can see these details.</p></div><button type="button" onClick={onCancel} className="rounded-lg px-3 py-2 text-xs text-stone-400 hover:bg-stone-800">Cancel</button></div><form onSubmit={submit} className="grid gap-4 sm:grid-cols-2"><Field label="Label"><input value={form.label} onChange={(event) => set("label", event.target.value)} className={inputClass} /></Field><Field label="Recipient"><input value={form.recipientName} onChange={(event) => set("recipientName", event.target.value)} className={inputClass} /></Field><Field label="Delivery phone (optional)"><input value={form.phone ?? ""} onChange={(event) => set("phone", event.target.value)} placeholder="082 123 4567" className={inputClass} /></Field><Field label="Street address"><input value={form.addressLine1} onChange={(event) => set("addressLine1", event.target.value)} className={inputClass} /></Field><Field label="Apartment, unit or building"><input value={form.addressLine2 ?? ""} onChange={(event) => set("addressLine2", event.target.value)} className={inputClass} /></Field><Field label="City or town"><input value={form.city} onChange={(event) => set("city", event.target.value)} className={inputClass} /></Field><Field label="Province"><select value={form.province} onChange={(event) => set("province", event.target.value as BuyerAddressInput["province"])} className={inputClass}>{SA_PROVINCES.map((province) => <option key={province}>{province}</option>)}</select></Field><Field label="Postal code"><input inputMode="numeric" maxLength={4} value={form.postalCode} onChange={(event) => set("postalCode", event.target.value.replace(/\D/g, ""))} className={inputClass} /></Field><label className="space-y-1.5 sm:col-span-2"><span className="text-xs font-medium text-stone-400">Delivery instructions (optional)</span><textarea value={form.deliveryInstructions ?? ""} onChange={(event) => set("deliveryInstructions", event.target.value)} maxLength={250} rows={3} className={`${inputClass} h-auto py-3`} /></label><label className="flex items-center gap-2 text-sm text-stone-300 sm:col-span-2"><input type="checkbox" checked={form.isDefault} onChange={(event) => set("isDefault", event.target.checked)} className="size-4 accent-emerald-600" />Use as my default address</label>{error && <p className="text-sm text-red-400 sm:col-span-2">{error}</p>}<button type="submit" disabled={isPending} className="h-11 rounded-xl bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 sm:col-span-2">{isPending ? "Saving…" : "Save address"}</button></form></div></div>;
}

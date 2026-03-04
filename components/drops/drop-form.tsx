// ============================================================
// Component — Drop Form (Client)
// ============================================================
// Product selector + auto-message generator + share buttons.
// Used for creating new stock drops.
// ============================================================

"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { createDropAction, publishDropAction } from "@/app/actions/drops";
import { formatZAR } from "@/types";

interface ShopProduct {
  id: string;
  name: string;
  minPriceCents: number;
  images: { url: string }[];
}

interface DropFormProps {
  shopSlug: string;
  shopName: string;
  whatsappNumber: string;
  products: ShopProduct[];
}

type SelectedProduct = {
  productId: string;
  productName: string;
  priceSnapshot: number;
  imageUrl: string;
};

function generateDropMessage(
  title: string,
  items: SelectedProduct[],
  shopName: string
): string {
  const productLines = items
    .map((item) => `• ${item.productName} — ${formatZAR(item.priceSnapshot)}`)
    .join("\n");

  return `${title}\n\n${productLines}\n\n📍 ${shopName}\n💬 Message us to order!`;
}

export function DropForm({
  shopSlug,
  shopName,
  whatsappNumber,
  products,
}: DropFormProps) {
  const [title, setTitle] = useState("🔥 New Stock Just Dropped!");
  const [selected, setSelected] = useState<SelectedProduct[]>([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [step, setStep] = useState<"select" | "preview" | "shared">("select");
  const [error, setError] = useState<string | null>(null);
  const [createdDropId, setCreatedDropId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filter products
  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      !selected.some((s) => s.productId === p.id)
  );

  function toggleProduct(product: ShopProduct) {
    setSelected((prev) => {
      const exists = prev.find((s) => s.productId === product.id);
      if (exists) return prev.filter((s) => s.productId !== product.id);
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          priceSnapshot: product.minPriceCents,
          imageUrl: product.images[0]?.url || "",
        },
      ];
    });
  }

  function removeProduct(productId: string) {
    setSelected((prev) => prev.filter((s) => s.productId !== productId));
  }

  function goToPreview() {
    if (selected.length === 0) {
      setError("Select at least one product");
      return;
    }
    const autoMessage = generateDropMessage(title, selected, shopName);
    setMessage(autoMessage);
    setError(null);
    setStep("preview");
  }

  function handleCreateAndPublish() {
    startTransition(async () => {
      setError(null);

      // Step 1: Create the drop
      const createResult = await createDropAction(shopSlug, {
        title,
        message,
        items: selected,
      });

      if (!createResult.success) {
        setError(createResult.error || "Failed to create drop.");
        return;
      }

      const dropId = (createResult.data as { id: string })?.id;
      if (!dropId) {
        setError("Failed to create drop.");
        return;
      }

      // Step 2: Publish it
      const publishResult = await publishDropAction(shopSlug, dropId);
      if (!publishResult.success) {
        setError(publishResult.error || "Created but failed to publish.");
        return;
      }

      setCreatedDropId(dropId);
      setStep("shared");
    });
  }

  const dropUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/catalog/${shopSlug}/drops/${createdDropId}`
      : `/catalog/${shopSlug}/drops/${createdDropId}`;

  const shareText = `${message}\n\n👉 See all products: ${dropUrl}\n\nvia TradeFeed — Create your free shop at tradefeed.co.za`;

  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(dropUrl)}&quote=${encodeURIComponent(message)}`;

  // ── Step 1: Select Products ─────────────────────────────

  if (step === "select") {
    return (
      <div className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-2">
            Drop Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 transition-all"
            placeholder="🔥 New Stock Just Dropped!"
            maxLength={200}
          />
        </div>

        {/* Selected products */}
        {selected.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-stone-700 mb-2">
              Selected ({selected.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {selected.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center gap-2 rounded-full bg-rose-50 border border-rose-200 px-3 py-1.5 text-sm"
                >
                  {item.imageUrl && (
                    <Image
                      src={item.imageUrl}
                      alt=""
                      width={20}
                      height={20}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                  )}
                  <span className="text-rose-700 font-medium truncate max-w-[120px]">
                    {item.productName}
                  </span>
                  <button
                    onClick={() => removeProduct(item.productId)}
                    className="text-rose-400 hover:text-rose-600 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-stone-200 transition-all"
            placeholder="🔍 Search your products..."
          />
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <p className="col-span-full text-center text-stone-400 py-8 text-sm">
              {products.length === 0
                ? "No products yet. Add products first!"
                : "No products match your search."}
            </p>
          ) : (
            filtered.map((product) => {
              const isSelected = selected.some(
                (s) => s.productId === product.id
              );
              return (
                <button
                  key={product.id}
                  onClick={() => toggleProduct(product)}
                  className={`relative flex flex-col rounded-xl border-2 overflow-hidden transition-all text-left ${
                    isSelected
                      ? "border-rose-400 bg-rose-50 shadow-md shadow-rose-100"
                      : "border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm"
                  }`}
                >
                  {/* Image */}
                  <div className="aspect-square bg-stone-100 relative">
                    {product.images[0] ? (
                      <Image
                        src={product.images[0].url}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-stone-300"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
                          />
                        </svg>
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 12.75l6 6 9-13.5"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="p-2.5">
                    <p className="text-xs font-medium text-stone-800 truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {formatZAR(product.minPriceCents)}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600 font-medium">{error}</p>
        )}

        {/* Next button */}
        <button
          onClick={goToPreview}
          disabled={selected.length === 0}
          className="w-full rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-rose-200 hover:shadow-xl hover:shadow-rose-300 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg"
        >
          Preview & Share →
        </button>
      </div>
    );
  }

  // ── Step 2: Preview & Share ─────────────────────────────

  if (step === "preview") {
    return (
      <div className="space-y-6">
        {/* Back */}
        <button
          onClick={() => setStep("select")}
          className="text-sm text-stone-500 hover:text-stone-700 transition-colors flex items-center gap-1"
        >
          ← Back to product selection
        </button>

        {/* Preview card */}
        <div className="rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50 p-5 space-y-4">
          <p className="text-xs uppercase tracking-wider text-stone-400 font-semibold">
            Preview
          </p>

          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setMessage(
                generateDropMessage(e.target.value, selected, shopName)
              );
            }}
            className="w-full text-lg font-bold text-stone-900 bg-transparent border-none outline-none focus:ring-0 p-0"
          />

          {/* Product thumbnails row */}
          <div className="flex -space-x-2 overflow-hidden">
            {selected.slice(0, 8).map((item) => (
              <div
                key={item.productId}
                className="w-12 h-12 rounded-xl border-2 border-white bg-stone-100 overflow-hidden flex-shrink-0"
              >
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt=""
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-stone-400">
                    📦
                  </div>
                )}
              </div>
            ))}
            {selected.length > 8 && (
              <div className="w-12 h-12 rounded-xl border-2 border-white bg-stone-200 flex items-center justify-center flex-shrink-0 text-xs font-bold text-stone-600">
                +{selected.length - 8}
              </div>
            )}
          </div>

          {/* Editable message */}
          <div>
            <label className="text-xs text-stone-400 font-semibold mb-1 block">
              Share Message (editable)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 transition-all resize-none font-mono"
              maxLength={2000}
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 font-medium">{error}</p>
        )}

        {/* Create & Publish button */}
        <button
          onClick={handleCreateAndPublish}
          disabled={isPending}
          className="w-full rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-rose-200 hover:shadow-xl hover:shadow-rose-300 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Creating...
            </span>
          ) : (
            "🚀 Create & Share Stock Drop"
          )}
        </button>
      </div>
    );
  }

  // ── Step 3: Shared! ─────────────────────────────────────

  return (
    <div className="space-y-6 text-center">
      {/* Success */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 p-8">
        <div className="text-5xl mb-3">🎉</div>
        <h2 className="text-xl font-bold text-emerald-800">
          Stock Drop Published!
        </h2>
        <p className="text-sm text-emerald-600 mt-2">
          Your drop is live. Share it with your customers now!
        </p>
      </div>

      {/* Share buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* WhatsApp */}
        <a
          href={whatsappShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-4 text-sm font-bold text-white hover:opacity-90 transition-opacity shadow-lg"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Share on WhatsApp
        </a>

        {/* Facebook */}
        <a
          href={facebookShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl bg-[#1877F2] px-6 py-4 text-sm font-bold text-white hover:opacity-90 transition-opacity shadow-lg"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          Share on Facebook
        </a>
      </div>

      {/* Copy Link */}
      <button
        onClick={() => {
          navigator.clipboard.writeText(shareText);
        }}
        className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-stone-200 px-6 py-3.5 text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
      >
        📋 Copy Share Message
      </button>

      {/* View drop page */}
      <a
        href={`/catalog/${shopSlug}/drops/${createdDropId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-emerald-600 transition-colors"
      >
        View public drop page →
      </a>

      {/* New Drop */}
      <button
        onClick={() => {
          setSelected([]);
          setTitle("🔥 New Stock Just Dropped!");
          setMessage("");
          setCreatedDropId(null);
          setError(null);
          setStep("select");
        }}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-rose-600 hover:text-rose-700 transition-colors"
      >
        + Create Another Drop
      </button>
    </div>
  );
}

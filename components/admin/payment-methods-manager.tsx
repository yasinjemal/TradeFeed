// ============================================================
// Component — Payment Methods Manager (Admin)
// ============================================================
// CRUD interface for manual payment methods.
// Create, edit, enable/disable, reorder.
// ============================================================

"use client";

import { useState, useTransition } from "react";
import {
  createPaymentMethodAction,
  updatePaymentMethodAction,
  deletePaymentMethodAction,
  reorderPaymentMethodsAction,
} from "@/app/actions/admin";

interface PaymentMethod {
  id: string;
  name: string;
  description: string | null;
  instructions: string;
  isActive: boolean;
  displayOrder: number;
}

interface PaymentMethodsManagerProps {
  methods: PaymentMethod[];
}

export function PaymentMethodsManager({ methods: initialMethods }: PaymentMethodsManagerProps) {
  const [methods, setMethods] = useState(initialMethods);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");

  const resetForm = () => {
    setName("");
    setDescription("");
    setInstructions("");
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (method: PaymentMethod) => {
    setName(method.name);
    setDescription(method.description ?? "");
    setInstructions(method.instructions);
    setEditingId(method.id);
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!name.trim() || !instructions.trim()) {
      setMessage({ type: "error", text: "Name and instructions are required." });
      return;
    }

    setMessage(null);
    startTransition(async () => {
      if (editingId) {
        const result = await updatePaymentMethodAction(editingId, {
          name: name.trim(),
          description: description.trim() || undefined,
          instructions: instructions.trim(),
        });
        if (result.success) {
          setMethods((prev) =>
            prev.map((m) =>
              m.id === editingId
                ? { ...m, name: name.trim(), description: description.trim() || null, instructions: instructions.trim() }
                : m,
            ),
          );
          setMessage({ type: "success", text: result.message });
          resetForm();
        } else {
          setMessage({ type: "error", text: "error" in result ? result.error : "Failed." });
        }
      } else {
        const result = await createPaymentMethodAction({
          name: name.trim(),
          description: description.trim() || undefined,
          instructions: instructions.trim(),
        });
        if (result.success) {
          setMessage({ type: "success", text: result.message });
          resetForm();
          // Reload to get new data
          window.location.reload();
        } else {
          setMessage({ type: "error", text: "error" in result ? result.error : "Failed." });
        }
      }
    });
  };

  const handleToggle = (method: PaymentMethod) => {
    startTransition(async () => {
      const result = await updatePaymentMethodAction(method.id, {
        isActive: !method.isActive,
      });
      if (result.success) {
        setMethods((prev) =>
          prev.map((m) => (m.id === method.id ? { ...m, isActive: !m.isActive } : m)),
        );
      }
    });
  };

  const handleDelete = (method: PaymentMethod) => {
    if (!confirm(`Delete "${method.name}"? This cannot be undone.`)) return;

    startTransition(async () => {
      const result = await deletePaymentMethodAction(method.id);
      if (result.success) {
        setMethods((prev) => prev.filter((m) => m.id !== method.id));
        setMessage({ type: "success", text: result.message });
      } else {
        setMessage({ type: "error", text: "error" in result ? result.error : "Failed." });
      }
    });
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newMethods = [...methods];
    const temp = newMethods[index - 1]!;
    newMethods[index - 1] = newMethods[index]!;
    newMethods[index] = temp;
    setMethods(newMethods);
    startTransition(async () => {
      await reorderPaymentMethodsAction(newMethods.map((m) => m.id));
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === methods.length - 1) return;
    const newMethods = [...methods];
    const temp = newMethods[index]!;
    newMethods[index] = newMethods[index + 1]!;
    newMethods[index + 1] = temp;
    setMethods(newMethods);
    startTransition(async () => {
      await reorderPaymentMethodsAction(newMethods.map((m) => m.id));
    });
  };

  return (
    <div className="space-y-6">
      {/* Status message */}
      {message && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-emerald-950/50 border-emerald-800 text-emerald-300"
              : "bg-red-950/50 border-red-800 text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Add button */}
      {!showForm && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Payment Method
        </button>
      )}

      {/* Create / Edit form */}
      {showForm && (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-stone-200">
            {editingId ? "Edit Payment Method" : "New Payment Method"}
          </h3>

          <div>
            <label className="block text-xs font-medium text-stone-400 mb-1.5">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Bank Transfer, Capitec Shop2Shop"
              className="w-full px-3 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-stone-200 text-sm placeholder:text-stone-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-400 mb-1.5">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description (optional)"
              className="w-full px-3 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-stone-200 text-sm placeholder:text-stone-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-400 mb-1.5">
              Instructions * <span className="text-stone-600">(Markdown supported)</span>
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder={"e.g.\n**Account Name:** TradeFeed (Pty) Ltd\n**Bank:** Capitec\n**Account No:** 1234567890\n**Reference:** Your shop name"}
              rows={6}
              className="w-full px-3 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-stone-200 text-sm placeholder:text-stone-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 resize-y"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
            >
              {isPending ? "Saving..." : editingId ? "Update" : "Create"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2.5 text-stone-400 hover:text-stone-200 text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Methods list */}
      {methods.length === 0 ? (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-8 text-center">
          <span className="text-3xl mb-3 block">💳</span>
          <p className="text-sm text-stone-400">No payment methods configured yet.</p>
          <p className="text-xs text-stone-600 mt-1">Add one so sellers can request manual upgrades.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {methods.map((method, index) => (
            <div
              key={method.id}
              className={`bg-stone-900 border rounded-2xl p-5 transition-all ${
                method.isActive ? "border-stone-800" : "border-stone-800/50 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-stone-200">{method.name}</h3>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        method.isActive
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-stone-700/50 text-stone-500"
                      }`}
                    >
                      {method.isActive ? "Active" : "Disabled"}
                    </span>
                  </div>
                  {method.description && (
                    <p className="text-xs text-stone-500 mb-2">{method.description}</p>
                  )}
                  <pre className="text-xs text-stone-400 whitespace-pre-wrap font-sans leading-relaxed bg-stone-800/50 rounded-lg p-3 mt-2">
                    {method.instructions}
                  </pre>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Reorder */}
                  <button
                    type="button"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0 || isPending}
                    className="p-1.5 text-stone-500 hover:text-stone-300 disabled:opacity-30 transition-colors"
                    title="Move up"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === methods.length - 1 || isPending}
                    className="p-1.5 text-stone-500 hover:text-stone-300 disabled:opacity-30 transition-colors"
                    title="Move down"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>

                  {/* Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggle(method)}
                    disabled={isPending}
                    className={`p-1.5 transition-colors ${
                      method.isActive
                        ? "text-emerald-400 hover:text-emerald-300"
                        : "text-stone-500 hover:text-emerald-400"
                    }`}
                    title={method.isActive ? "Disable" : "Enable"}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      {method.isActive ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      )}
                    </svg>
                  </button>

                  {/* Edit */}
                  <button
                    type="button"
                    onClick={() => startEdit(method)}
                    className="p-1.5 text-stone-500 hover:text-stone-300 transition-colors"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                    </svg>
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => handleDelete(method)}
                    disabled={isPending}
                    className="p-1.5 text-stone-500 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

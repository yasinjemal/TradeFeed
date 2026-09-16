"use client";
import { useActionState, type ReactNode } from "react";
export function OperationsForm({
  action,
  children,
}: {
  action: (form: FormData) => Promise<void>;
  children: ReactNode;
}) {
  const [message, submit, pending] = useActionState(
    async (_: string, form: FormData) => {
      try {
        await action(form);
        return "Saved to the audit trail. You own this follow-up.";
      } catch {
        return "Could not save. Check the required fields and your admin access, then try again.";
      }
    },
    "",
  );
  return (
    <form action={submit} className="grid gap-3 rounded-lg bg-stone-900 p-4">
      {children}
      <button
        disabled={pending}
        className="min-h-11 rounded-lg bg-emerald-700 px-4 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save follow-up"}
      </button>
      <p role="status" className="text-sm text-stone-200">
        {message}
      </p>
    </form>
  );
}

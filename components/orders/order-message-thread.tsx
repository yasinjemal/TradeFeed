"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState, useTransition } from "react";
import { CheckCheck, LockKeyhole, Send } from "lucide-react";

import {
  markBuyerOrderMessagesReadAction,
  markSellerOrderMessagesReadAction,
  sendBuyerOrderMessageAction,
  sendSellerOrderMessageAction,
} from "@/app/actions/order-messages";

type ThreadMessage = {
  id: string;
  senderType: "BUYER" | "SELLER";
  senderName: string;
  body: string;
  readAt: Date | string | null;
  createdAt: Date | string;
};

type OrderMessageThreadProps = {
  orderId: string;
  orderNumber: string;
  viewer: "BUYER" | "SELLER";
  participantName: string;
  initialMessages: ThreadMessage[];
  shopSlug?: string;
};

export function OrderMessageThread({
  orderId,
  orderNumber,
  viewer,
  participantName,
  initialMessages,
  shopSlug,
}: OrderMessageThreadProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const messagePaneRef = useRef<HTMLDivElement>(null);
  const isBuyer = viewer === "BUYER";

  useEffect(() => setMessages(initialMessages), [initialMessages]);
  useEffect(() => {
    const pane = messagePaneRef.current;
    if (pane) pane.scrollTop = pane.scrollHeight;
  }, [messages.length]);
  useEffect(() => {
    if (isBuyer) {
      void markBuyerOrderMessagesReadAction(orderId);
    } else if (shopSlug) {
      void markSellerOrderMessagesReadAction(shopSlug, orderId);
    }
  }, [isBuyer, orderId, shopSlug]);

  function submitMessage(event?: FormEvent) {
    event?.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || isPending) return;

    setError(null);
    setBody("");
    const optimisticId = `pending-${Date.now()}`;
    const optimistic: ThreadMessage = {
      id: optimisticId,
      senderType: viewer,
      senderName: "You",
      body: trimmed,
      readAt: null,
      createdAt: new Date(),
    };
    setMessages((current) => [...current, optimistic]);

    startTransition(async () => {
      const result = isBuyer
        ? await sendBuyerOrderMessageAction(orderId, trimmed)
        : await sendSellerOrderMessageAction(shopSlug ?? "", orderId, trimmed);

      if (!result.success || !result.message) {
        setMessages((current) => current.filter((message) => message.id !== optimisticId));
        setBody(trimmed);
        setError(result.error ?? "Your message could not be sent.");
        return;
      }

      setMessages((current) => current.map((message) => (
        message.id === optimisticId ? result.message! : message
      )));
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitMessage();
    }
  }

  const shell = isBuyer
    ? "border-stone-800/60 bg-stone-900/50"
    : "border-stone-200 bg-white";
  const muted = isBuyer ? "text-stone-500" : "text-stone-500";

  return (
    <div className={`overflow-hidden rounded-2xl border ${shell}`}>
      <div className={`border-b px-4 py-3 ${isBuyer ? "border-stone-800/60" : "border-stone-100"}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className={`text-sm font-semibold ${isBuyer ? "text-stone-100" : "text-stone-900"}`}>{participantName}</p>
            <p className={`mt-0.5 text-xs ${muted}`}>Order {orderNumber}</p>
          </div>
          <span className={`inline-flex items-center gap-1 text-[11px] ${muted}`}><LockKeyhole className="size-3" />Private order chat</span>
        </div>
      </div>

      <div ref={messagePaneRef} className={`max-h-[52vh] min-h-80 space-y-3 overflow-y-auto px-4 py-5 ${isBuyer ? "bg-stone-950/35" : "bg-stone-50/60"}`} aria-live="polite">
        {messages.length === 0 ? (
          <div className="flex min-h-64 items-center justify-center text-center">
            <div>
              <p className={`text-sm font-medium ${isBuyer ? "text-stone-300" : "text-stone-700"}`}>Start the conversation</p>
              <p className={`mx-auto mt-1 max-w-xs text-xs leading-relaxed ${muted}`}>Ask about this order, delivery, collection, sizing, or payment. Keep all important details here for reference.</p>
            </div>
          </div>
        ) : messages.map((message) => {
          const mine = message.senderType === viewer;
          return (
            <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${mine ? "rounded-br-md bg-emerald-600 text-white" : isBuyer ? "rounded-bl-md border border-stone-800 bg-stone-900 text-stone-200" : "rounded-bl-md border border-stone-200 bg-white text-stone-800"}`}>
                {!mine && <p className={`mb-1 text-[10px] font-semibold ${isBuyer ? "text-emerald-400" : "text-emerald-700"}`}>{message.senderName}</p>}
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.body}</p>
                <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${mine ? "text-emerald-100" : muted}`}>
                  {new Date(message.createdAt).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
                  {mine && message.readAt && <CheckCheck className="size-3" aria-label="Read" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={submitMessage} className={`border-t p-3 ${isBuyer ? "border-stone-800/60 bg-stone-900" : "border-stone-100 bg-white"}`}>
        <div className="flex items-end gap-2">
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={1500}
            rows={1}
            placeholder="Write a message…"
            aria-label="Message"
            className={`max-h-32 min-h-11 flex-1 resize-none rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-emerald-500/30 ${isBuyer ? "border-stone-700 bg-stone-950 text-stone-100 placeholder:text-stone-600" : "border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-400"}`}
          />
          <button type="submit" disabled={!body.trim() || isPending} className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Send message">
            <Send className="size-4" />
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className={`text-[10px] ${muted}`}>Enter to send · Shift + Enter for a new line</p>
          <p className={`text-[10px] ${body.length > 1400 ? "text-amber-500" : muted}`}>{body.length}/1500</p>
        </div>
        {error && <p className="mt-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-500">{error}</p>}
      </form>
    </div>
  );
}

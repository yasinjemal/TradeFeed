"use client";

import { useEffect, useId, useState } from "react";
import type { LocationSuggestion } from "@/lib/location/geoapify";

interface LocationAutocompleteProps {
  value: string;
  disabled?: boolean;
  inputClassName?: string;
  onValueChange: (value: string) => void;
  onSelect: (suggestion: LocationSuggestion) => void;
}

export function LocationAutocomplete({
  value,
  disabled,
  inputClassName,
  onValueChange,
  onSelect,
}: LocationAutocompleteProps) {
  const listId = useId();
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [providerEnabled, setProviderEnabled] = useState(true);
  const [message, setMessage] = useState("");
  const [userEdited, setUserEdited] = useState(false);

  useEffect(() => {
    // Do not send an already-saved address to a third party merely because
    // the seller opened settings. Query only after a deliberate edit.
    if (!userEdited) {
      setSuggestions([]);
      setMessage("");
      return;
    }

    const query = value.trim();
    if (query.length < 3) {
      setSuggestions([]);
      setMessage("");
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setMessage("");

      try {
        const response = await fetch("/api/location/autocomplete", {
          method: "POST",
          signal: controller.signal,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query }),
        });
        const payload = (await response.json()) as {
          enabled?: boolean;
          suggestions?: LocationSuggestion[];
          error?: string;
        };

        setProviderEnabled(payload.enabled !== false);
        setSuggestions(
          response.ok && Array.isArray(payload.suggestions)
            ? payload.suggestions
            : [],
        );

        if (!response.ok && payload.enabled !== false) {
          setMessage(payload.error || "Suggestions unavailable. Enter the address manually.");
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setSuggestions([]);
          setMessage("Suggestions unavailable. Enter the address manually.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [userEdited, value]);

  const choose = (suggestion: LocationSuggestion) => {
    setUserEdited(false);
    onValueChange(suggestion.address);
    onSelect(suggestion);
    setSuggestions([]);
    setMessage("");
  };

  return (
    <div className="relative">
      <input
        id="address"
        name="address"
        type="text"
        role="combobox"
        autoComplete="street-address"
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={suggestions.length > 0}
        value={value}
        onChange={(event) => {
          setUserEdited(true);
          onValueChange(event.target.value);
        }}
        placeholder="e.g. Shop 42, Marble Tower, 62 Jeppe St"
        className={inputClassName}
        disabled={disabled}
        maxLength={300}
      />

      {loading && (
        <span className="pointer-events-none absolute right-3 top-3.5 size-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      )}

      {suggestions.length > 0 && (
        <div
          id={listId}
          role="listbox"
          aria-label="South African address suggestions"
          className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl"
        >
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              type="button"
              role="option"
              aria-selected={false}
              onClick={() => choose(suggestion)}
              className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
            >
              <span className="block font-medium">{suggestion.address}</span>
              <span className="mt-0.5 block text-xs text-slate-500">
                {suggestion.city}, {suggestion.province}
                {suggestion.postalCode ? ` ${suggestion.postalCode}` : ""}
              </span>
            </button>
          ))}
        </div>
      )}

      <p className="mt-1 min-h-4 text-[11px] text-slate-400" aria-live="polite">
        {!providerEnabled
          ? "Enter the address manually; smart suggestions are not configured."
          : message}
      </p>
      {providerEnabled && (
        <p className="text-[10px] text-slate-400">
          Powered by{" "}
          <a
            href="https://www.geoapify.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Geoapify
          </a>
          {" · "}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            © OpenStreetMap contributors
          </a>
        </p>
      )}
    </div>
  );
}

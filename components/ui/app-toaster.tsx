"use client";

import { useTheme } from "next-themes";
import { Toaster } from "sonner";

/**
 * Theme-following Sonner toaster. Sonner's `theme` prop handles the
 * palette swap; we keep only shape/size overrides here so toasts stay
 * readable in both light and dark mode instead of the previous
 * hardcoded dark style.
 */
export function AppToaster() {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      position="top-center"
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      toastOptions={{
        style: {
          borderRadius: "12px",
          fontSize: "13px",
          padding: "12px 16px",
        },
      }}
      expand={false}
      richColors
    />
  );
}

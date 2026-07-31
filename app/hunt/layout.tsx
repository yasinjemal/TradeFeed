import type { ReactNode } from "react";

import { TfFonts } from "@/components/tf/tf-fonts";

export default function HuntLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-tf-surface text-tf-ink">
      <TfFonts />
      {children}
    </div>
  );
}

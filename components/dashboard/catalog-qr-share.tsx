"use client";

import { useRef, useState } from "react";
import { CopyButton } from "@/components/ui/copy-button";

const BASE_URL = "https://tradefeed.co.za";

interface CatalogQrShareProps {
  catalogPath: string;
  shopName: string;
}

type TemplateStyle = "dark" | "light" | "colorful";

const TEMPLATES: Record<TemplateStyle, { label: string; bg: string; text: string; accent: string; sub: string }> = {
  dark: { label: "Dark", bg: "#1A1A1A", text: "#F5F5F5", accent: "#25D366", sub: "#999999" },
  light: { label: "Light", bg: "#FFFFFF", text: "#1A1A1A", accent: "#25D366", sub: "#666666" },
  colorful: { label: "Colorful", bg: "linear-gradient(135deg, #0F2027, #203A43, #2C5364)", text: "#FFFFFF", accent: "#34D399", sub: "#93C5FD" },
};

/**
 * QR code for catalog URL — for offline sharing (print, stall, packaging).
 * Includes 3 printable A5 templates with PNG download.
 */
export function CatalogQrShare({ catalogPath, shopName }: CatalogQrShareProps) {
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState<TemplateStyle>("dark");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fullUrl = `${BASE_URL}${catalogPath}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(fullUrl)}`;

  /** Draw A5 template to canvas at 300 DPI (1748×2480) and trigger download */
  async function downloadPng() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 1748; // A5 @ 300 DPI
    const H = 2480;
    canvas.width = W;
    canvas.height = H;

    const t = TEMPLATES[style];

    // Background
    if (t.bg.startsWith("linear")) {
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, "#0F2027");
      grad.addColorStop(0.5, "#203A43");
      grad.addColorStop(1, "#2C5364");
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = t.bg;
    }
    ctx.fillRect(0, 0, W, H);

    // "Scan to Shop" heading
    ctx.fillStyle = t.accent;
    ctx.font = "bold 100px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Scan to Shop", W / 2, 320);

    // Shop name
    ctx.fillStyle = t.text;
    ctx.font = "bold 80px sans-serif";
    ctx.fillText(shopName, W / 2, 480);

    // QR code — load and draw centered
    const qr = new Image();
    qr.crossOrigin = "anonymous";
    qr.src = qrImageUrl;
    await new Promise<void>((resolve) => {
      qr.onload = () => resolve();
      qr.onerror = () => resolve();
    });

    const qrSize = 900;
    const qrX = (W - qrSize) / 2;
    const qrY = 620;

    // White background behind QR for scanability
    ctx.fillStyle = "#FFFFFF";
    const pad = 40;
    ctx.beginPath();
    ctx.roundRect(qrX - pad, qrY - pad, qrSize + pad * 2, qrSize + pad * 2, 32);
    ctx.fill();
    ctx.drawImage(qr, qrX, qrY, qrSize, qrSize);

    // URL text
    ctx.fillStyle = t.sub;
    ctx.font = "44px monospace";
    ctx.fillText(fullUrl, W / 2, qrY + qrSize + 140);

    // TradeFeed branding
    ctx.fillStyle = t.sub;
    ctx.font = "36px sans-serif";
    ctx.fillText("Powered by TradeFeed.co.za", W / 2, H - 100);

    // Trigger download
    const link = document.createElement("a");
    link.download = `${shopName.replace(/\s+/g, "-")}-QR-${style}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-900 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.5a.75.75 0 00-.75.75v3.75a.75.75 0 00.75.75h3.75a.75.75 0 00.75-.75V5.25a.75.75 0 00-.75-.75H3.75zM3.75 15.75a.75.75 0 00-.75.75V21a.75.75 0 00.75.75h3.75a.75.75 0 00.75-.75v-3.75a.75.75 0 00-.75-.75H3.75zM15.75 4.5a.75.75 0 00-.75.75v3.75a.75.75 0 00.75.75H21a.75.75 0 00.75-.75V5.25a.75.75 0 00-.75-.75h-3.75zM15.75 15.75a.75.75 0 00-.75.75V21a.75.75 0 00.75.75H21a.75.75 0 00.75-.75v-3.75a.75.75 0 00-.75-.75h-3.75z" />
        </svg>
        Get QR code
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="QR code for catalog"
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Print-ready QR Code</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Template selector */}
            <div className="flex gap-2">
              {(Object.entries(TEMPLATES) as [TemplateStyle, typeof TEMPLATES.dark][]).map(([key, t]) => (
                <button
                  key={key}
                  onClick={() => setStyle(key)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all border-2 ${
                    style === key ? "border-emerald-500 ring-2 ring-emerald-500/30" : "border-transparent"
                  }`}
                  style={{
                    background: t.bg.startsWith("linear") ? t.bg : t.bg,
                    color: t.text,
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Preview card */}
            <div
              className="rounded-xl p-6 text-center space-y-3"
              style={{
                background: TEMPLATES[style].bg,
                color: TEMPLATES[style].text,
              }}
            >
              <p className="font-bold text-lg" style={{ color: TEMPLATES[style].accent }}>
                Scan to Shop
              </p>
              <p className="font-bold text-base">{shopName}</p>
              <div className="flex justify-center">
                <div className="bg-white rounded-lg p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrImageUrl}
                    alt={`QR code for ${shopName} catalog`}
                    width={256}
                    height={256}
                    className="w-40 h-40 sm:w-48 sm:h-48"
                  />
                </div>
              </div>
              <p className="font-mono text-xs opacity-60">{fullUrl}</p>
              <p className="text-[10px] opacity-40">Powered by TradeFeed.co.za</p>
            </div>

            {/* URL + copy */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-slate-600 truncate flex-1">{fullUrl}</span>
              <CopyButton text={fullUrl} />
            </div>

            {/* Download button */}
            <button
              onClick={downloadPng}
              className="block w-full py-2.5 rounded-xl text-center text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
            >
              Download A5 Print PNG (300 DPI)
            </button>

            {/* Hidden canvas for render */}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>
      )}
    </>
  );
}

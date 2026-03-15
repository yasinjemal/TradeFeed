"use client";

import { useState } from "react";
import { CopyButton } from "@/components/ui/copy-button";

const BASE_URL = "https://tradefeed.co.za";

interface CatalogQrShareProps {
  catalogPath: string;
  shopName: string;
}

/**
 * QR code for catalog URL — for offline sharing (print, stall, packaging).
 * Uses a free public API to generate the QR image; no dependency.
 */
export function CatalogQrShare({ catalogPath, shopName }: CatalogQrShareProps) {
  const [open, setOpen] = useState(false);
  const fullUrl = `${BASE_URL}${catalogPath}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(fullUrl)}`;

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
            className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-stone-900">QR code for your catalog</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-stone-500">
              Customers can scan this to open your catalog. Print it for your stall or packaging.
            </p>
            <div className="flex justify-center bg-stone-50 rounded-xl p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrImageUrl}
                alt={`QR code for ${shopName} catalog`}
                width={256}
                height={256}
                className="w-48 h-48 sm:w-56 sm:h-56"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-stone-600 truncate flex-1">{fullUrl}</span>
              <CopyButton text={fullUrl} />
            </div>
            <a
              href={qrImageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-2.5 rounded-xl text-center text-sm font-semibold bg-stone-900 text-white hover:bg-stone-800 transition-colors"
            >
              Open QR image (right-click to save)
            </a>
          </div>
        </div>
      )}
    </>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TradeFeed — Digital Catalogs for SA Wholesalers",
  description:
    "Replace chaotic WhatsApp selling with structured digital catalog infrastructure for South African clothing wholesalers & retailers.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

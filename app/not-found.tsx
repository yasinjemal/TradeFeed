import Link from "next/link";
import { IllustrationNotFound } from "@/components/ui/illustrations";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto mb-6">
          <IllustrationNotFound className="w-56 h-56 mx-auto" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
        <p className="text-stone-400 text-sm mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-all active:scale-[0.98]"
          >
            Go Home
          </Link>
          <Link
            href="/marketplace"
            className="px-5 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-sm font-medium rounded-xl transition-all border border-stone-700"
          >
            Browse Marketplace
          </Link>
        </div>
      </div>
    </div>
  );
}

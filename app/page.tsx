import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          Trade<span className="text-green-600">Feed</span>
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Digital catalogs for South African clothing wholesalers.
        </p>
        <p className="mt-2 text-sm text-gray-400">
          Replace chaotic WhatsApp selling with structured digital catalogs.
        </p>
        <Link
          href="/create-shop"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-green-600 px-6 py-3 text-sm font-medium text-white hover:bg-green-700 transition-colors"
        >
          Create Your Shop →
        </Link>
      </div>
    </main>
  );
}

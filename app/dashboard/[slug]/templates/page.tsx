// ============================================================
// Page — Quick Reply Templates
// ============================================================
// Pre-written WhatsApp reply templates for common buyer questions.
// One-tap copy to clipboard — paste straight into WhatsApp.
// ============================================================

import { requireShopAccess } from "@/lib/auth";
import { QuickReplyTemplates } from "@/components/dashboard/quick-reply-templates";

interface TemplatesPageProps {
  params: Promise<{ slug: string }>;
}

export default async function TemplatesPage({ params }: TemplatesPageProps) {
  const { slug } = await params;
  const access = await requireShopAccess(slug);
  if (!access) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-stone-900">⚡ Quick Replies</h1>
        <p className="mt-1 text-sm text-stone-500">
          Tap any template to copy — paste straight into WhatsApp
        </p>
      </div>

      <QuickReplyTemplates shopSlug={slug} />
    </div>
  );
}

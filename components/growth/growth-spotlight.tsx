import Link from "next/link";
import { ArrowRight, Images, Store, WandSparkles } from "lucide-react";

import { TfButton } from "@/components/tf/button";

const steps = [
  {
    icon: Images,
    title: "Send your product photos",
    description: "Share what you already have on WhatsApp.",
  },
  {
    icon: WandSparkles,
    title: "We build the catalogue",
    description: "We organise, write, and polish every listing.",
  },
  {
    icon: Store,
    title: "Launch one professional shop",
    description: "Share your TradeFeed link and start taking orders.",
  },
];

export function GrowthSpotlight() {
  return (
    <section
      aria-labelledby="growth-spotlight-title"
      className="border-y border-tf-stone-200 bg-tf-surface"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="overflow-hidden rounded-3xl border border-tf-stone-200 bg-tf-raised shadow-tf-md">
          <div className="grid items-stretch lg:grid-cols-[1.08fr_0.92fr]">
            <div className="flex flex-col justify-center px-6 py-10 sm:px-10 sm:py-12 lg:px-12">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-tf-primary">
                TradeFeed Growth
              </p>
              <h2
                id="growth-spotlight-title"
                className="mt-3 max-w-xl font-tf-display text-3xl font-semibold tracking-tight text-tf-ink sm:text-4xl"
              >
                Don&apos;t have time to build your shop?
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-tf-stone-600">
                Send us your product photos. We&apos;ll organise your catalogue,
                write professional listings, and launch your TradeFeed shop for
                you.
              </p>
              <div className="mt-7">
                <TfButton asChild size="lg">
                  <Link href="/growth">
                    Get it done for me
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </TfButton>
              </div>
            </div>

            <div className="border-t border-tf-stone-200 bg-tf-stone-50 p-5 sm:p-7 lg:border-l lg:border-t-0 lg:p-8">
              <div className="grid h-full gap-3">
                {steps.map(({ icon: Icon, title, description }, index) => (
                  <div
                    key={title}
                    className="flex items-center gap-4 rounded-2xl border border-tf-stone-200 bg-tf-raised p-4 shadow-tf-sm"
                  >
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-tf-verified-soft text-tf-primary">
                      <Icon className="size-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-tf-stone-400">
                        Step {index + 1}
                      </p>
                      <h3 className="mt-0.5 text-sm font-semibold text-tf-ink">
                        {title}
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-tf-stone-500">
                        {description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

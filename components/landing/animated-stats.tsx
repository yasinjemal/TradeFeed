"use client";

import { useEffect, useRef, useState } from "react";

// ============================================================
// Animated Counter — Intersection Observer + easeOutExpo
// ============================================================
// Counts from 0 to target when the element scrolls into view.
// Used on the landing page for live platform stats.
// ============================================================

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function AnimatedCounter({
  target,
  suffix = "",
  prefix = "",
  duration = 2000,
}: {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const start = performance.now();

          function tick(now: number) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeOutExpo(progress);
            setCount(Math.round(eased * target));

            if (progress < 1) {
              requestAnimationFrame(tick);
            }
          }

          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration, hasAnimated]);

  return (
    <span ref={ref}>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

// ============================================================
// Scroll Reveal — Fade-in + slide-up on intersection
// ============================================================

export function ScrollReveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ============================================================
// Gradient Animation — Slow-moving background gradient
// ============================================================

export function AnimatedGradient({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(16, 185, 129, 0.12), transparent), radial-gradient(ellipse 60% 40% at 80% 50%, rgba(59, 130, 246, 0.06), transparent), radial-gradient(ellipse 60% 40% at 20% 80%, rgba(168, 85, 247, 0.06), transparent)",
        }}
      />
      {children}
    </div>
  );
}

// ============================================================
// FAQ Accordion — Smooth animated open/close
// ============================================================

export function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    }
  }, [answer]);

  return (
    <div className="rounded-xl border border-stone-800/50 bg-stone-900/40 overflow-hidden hover:border-stone-700/60 transition-colors">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-6 py-5 text-left group"
      >
        <span className="font-medium text-sm text-stone-200 pr-4 group-hover:text-white transition-colors">{question}</span>
        <div className={`w-6 h-6 rounded-full border border-stone-700 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${isOpen ? "bg-emerald-600 border-emerald-600 rotate-45" : "group-hover:border-stone-600"}`}>
          <svg className="w-3.5 h-3.5 text-stone-400" style={{ color: isOpen ? "white" : undefined }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </div>
      </button>
      <div
        style={{ maxHeight: isOpen ? `${height}px` : "0px" }}
        className="overflow-hidden transition-all duration-300 ease-in-out"
      >
        <div ref={contentRef} className="px-6 pb-5">
          <p className="text-sm text-stone-400 leading-relaxed">{answer}</p>
        </div>
      </div>
    </div>
  );
}

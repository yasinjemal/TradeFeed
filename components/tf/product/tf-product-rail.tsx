"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

/** A real scrollable list: swipe and keyboard navigation work without clones. */
export function TfProductRail({ title, autoPlay = false, children }: {
  title: string; autoPlay?: boolean; children: ReactNode;
}) {
  const id = useId();
  const rail = useRef<HTMLUListElement>(null);
  const section = useRef<HTMLElement>(null);
  const direction = useRef(1);
  const [bounds, setBounds] = useState({ overflow: false, start: true, end: false });
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [hidden, setHidden] = useState(false);
  // Start motion only after reading the OS preference.
  const [reducedMotion, setReducedMotion] = useState(true);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(preference.matches);
    const updateVisibility = () => setHidden(document.hidden);
    updatePreference();
    updateVisibility();
    preference.addEventListener("change", updatePreference);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      preference.removeEventListener("change", updatePreference);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  useEffect(() => {
    const element = rail.current;
    const container = section.current;
    if (!element || !container) return;
    const update = () => {
      const maximum = element.scrollWidth - element.clientWidth;
      setBounds({ overflow: maximum > 2, start: element.scrollLeft <= 2, end: element.scrollLeft >= maximum - 2 });
    };
    const resize = new ResizeObserver(update);
    resize.observe(element);
    for (const child of element.children) resize.observe(child);
    const intersection = new IntersectionObserver(([entry]) => setVisible(Boolean(entry?.isIntersecting && entry.intersectionRatio >= 0.35)), { threshold: 0.35 });
    intersection.observe(container);
    element.addEventListener("scroll", update, { passive: true });
    update();
    return () => { resize.disconnect(); intersection.disconnect(); element.removeEventListener("scroll", update); };
  }, [children]);

  const advance = useCallback((towards: number) => {
    const element = rail.current;
    const first = element?.firstElementChild;
    if (!element || !first) return;
    const step = first.getBoundingClientRect().width + (parseFloat(getComputedStyle(element).columnGap) || 0);
    const maximum = element.scrollWidth - element.clientWidth;
    element.scrollTo({ left: Math.max(0, Math.min(maximum, element.scrollLeft + towards * step)), behavior: reducedMotion ? "instant" : "smooth" });
  }, [reducedMotion]);

  useEffect(() => {
    if (!autoPlay || paused || hovered || focused || !visible || hidden || reducedMotion || !bounds.overflow) return;
    const timer = window.setInterval(() => {
      const element = rail.current;
      if (!element) return;
      const maximum = element.scrollWidth - element.clientWidth;
      if (element.scrollLeft >= maximum - 2) direction.current = -1;
      else if (element.scrollLeft <= 2) direction.current = 1;
      advance(direction.current);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [autoPlay, paused, hovered, focused, visible, hidden, reducedMotion, bounds.overflow, advance]);

  const control = "inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-tf-stone-200 bg-tf-raised text-tf-ink transition-colors hover:border-tf-primary hover:text-tf-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tf-primary disabled:cursor-default disabled:opacity-30";
  return (
    <section ref={section} aria-labelledby={`${id}-title`} aria-roledescription="carousel"
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 id={`${id}-title`} className="font-tf-editorial text-2xl font-medium tracking-[-0.02em] text-tf-ink sm:text-3xl">{title}</h2>
          {bounds.overflow && <p className="mt-1 text-xs text-tf-stone-500">Swipe or use the arrows to explore</p>}
        </div>
        {bounds.overflow && <div className="flex items-center gap-2" aria-label="Product carousel controls">
          {autoPlay && !reducedMotion && <button type="button" className={control} aria-controls={id} aria-label={paused ? "Play product carousel" : "Pause product carousel"} onClick={() => setPaused(value => !value)}>{paused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}</button>}
          <button type="button" className={control} aria-controls={id} aria-label="Previous products" disabled={bounds.start} onClick={() => { setPaused(true); advance(-1); }}><ChevronLeft size={20} aria-hidden="true" /></button>
          <button type="button" className={control} aria-controls={id} aria-label="Next products" disabled={bounds.end} onClick={() => { setPaused(true); advance(1); }}><ChevronRight size={20} aria-hidden="true" /></button>
        </div>}
      </div>
      <ul ref={rail} id={id} className="tf-rail mt-4 flex snap-x snap-proximity gap-3 overflow-x-auto pb-3 pr-1 scrollbar-hide"
        onPointerDown={() => setPaused(true)} onWheel={() => setPaused(true)} onKeyDown={() => setPaused(true)}>
        {children}
      </ul>
    </section>
  );
}

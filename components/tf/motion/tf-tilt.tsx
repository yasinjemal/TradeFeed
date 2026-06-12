"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

// ============================================================
// TfTilt — pointer-reactive 3D tilt with smooth spring-back.
// The Apple-style depth cue for hero objects (phone mock,
// verified seller card).
//
// Safety properties (same bar as TfReveal):
// - Only activates on fine pointers with hover (desktop mice) —
//   touch devices and keyboards never see a transform.
// - prefers-reduced-motion users: completely inert.
// - rAF lerp loop runs only while the pointer is over the
//   element or the tilt is still settling back to zero.
// - Compositor-only (rotateX/rotateY), max ±5° — depth, not
//   a carnival ride.
// ============================================================

const MAX_TILT_DEG = 5;
const LERP = 0.12;

interface TfTiltProps extends React.ComponentProps<"div"> {
  /** Wraps children in a perspective stage and tilts the inner element */
  children: React.ReactNode;
}

export function TfTilt({ className, children, ...props }: TfTiltProps) {
  const stageRef = React.useRef<HTMLDivElement>(null);
  const innerRef = React.useRef<HTMLDivElement>(null);
  const target = React.useRef({ x: 0, y: 0 });
  const current = React.useRef({ x: 0, y: 0 });
  const raf = React.useRef<number | null>(null);
  const enabled = React.useRef(false);

  React.useEffect(() => {
    enabled.current =
      window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return () => {
      if (raf.current != null) cancelAnimationFrame(raf.current);
    };
  }, []);

  const kick = React.useCallback(() => {
    if (raf.current != null) return;
    const loop = () => {
      const inner = innerRef.current;
      if (!inner) {
        raf.current = null;
        return;
      }
      const cur = current.current;
      const tgt = target.current;
      cur.x += (tgt.x - cur.x) * LERP;
      cur.y += (tgt.y - cur.y) * LERP;
      const resting =
        tgt.x === 0 && tgt.y === 0 && Math.abs(cur.x) < 0.05 && Math.abs(cur.y) < 0.05;
      if (resting) {
        cur.x = 0;
        cur.y = 0;
        inner.style.transform = "";
        raf.current = null;
        return;
      }
      inner.style.transform = `rotateX(${cur.x.toFixed(2)}deg) rotateY(${cur.y.toFixed(2)}deg)`;
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!enabled.current) return;
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    target.current = { x: -py * MAX_TILT_DEG * 2, y: px * MAX_TILT_DEG * 2 };
    kick();
  };

  const handlePointerLeave = () => {
    target.current = { x: 0, y: 0 };
    kick();
  };

  return (
    <div
      ref={stageRef}
      className={cn("tf-tilt", className)}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      {...props}
    >
      <div ref={innerRef} className="tf-tilt-inner">
        {children}
      </div>
    </div>
  );
}

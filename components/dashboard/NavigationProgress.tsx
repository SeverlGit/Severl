"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Thin top-of-viewport progress bar that pulses during route transitions.
 * Copied from the Linear/Vercel pattern:
 *  1. On navigation start → bar animates to ~75% in ~300ms
 *  2. On navigation complete → bar quickly jumps to 100% and fades out
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevRef = useRef<string>("");

  // Stringify the current route so we can detect changes
  const current = `${pathname}?${searchParams.toString()}`;

  useEffect(() => {
    if (prevRef.current && prevRef.current !== current) {
      // Navigation completed — jump to 100% and fade out
      setProgress(100);
      timerRef.current = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 400);
    }
    prevRef.current = current;
  }, [current]);

  // We can't hook into navigation *start* directly without a router-event API,
  // so we rely on link clicks triggering the bar immediately via a global click handler.
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a[href]") as HTMLAnchorElement | null;
      if (!target) return;
      const href = target.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("http") || target.hasAttribute("data-no-progress")) return;

      // Internal navigation — start the progress bar
      if (timerRef.current) clearTimeout(timerRef.current);
      setProgress(0);
      setVisible(true);

      // Quickly animate to ~72% to simulate "loading"
      requestAnimationFrame(() => {
        setProgress(72);
      });
    };

    document.addEventListener("click", handleLinkClick, { capture: true });
    return () => document.removeEventListener("click", handleLinkClick, { capture: true });
  }, []);

  if (!visible && progress === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[2px]"
      aria-hidden="true"
    >
      <div
        className="h-full bg-brand-rose transition-all"
        style={{
          width: `${progress}%`,
          transitionDuration: progress === 100 ? "200ms" : "300ms",
          transitionTimingFunction: progress === 100 ? "ease-out" : "cubic-bezier(0.1, 0.4, 0.5, 1)",
          opacity: visible ? 1 : 0,
        }}
      />
      {/* Glowing tip */}
      <div
        className="absolute -top-px right-0 h-[4px] w-16 blur-sm bg-brand-rose opacity-60 transition-all"
        style={{ width: `${progress * 0.1}%` }}
      />
    </div>
  );
}

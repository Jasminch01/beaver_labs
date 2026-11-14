"use client";

import { useRef, type ReactNode } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";

/*
 * "What We Build" service cards.
 * Desktop uses a bento grid (see home.tsx). On mobile the cards sit in a
 * pinned stack: scrolling flips the top card off to the side to reveal the next,
 * resting briefly on each one.
 */

export type Service = {
  number: string;
  title: string;
  description: string;
  tags: string[];
  className: string;
  highlight: boolean;
};

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export const serviceCardClass = (s: Service) =>
  cn(
    "group flex flex-col p-6 md:p-9 rounded-[1.75rem] md:rounded-[2rem] border overflow-hidden",
    s.highlight
      ? "bg-[#0e0e16] bg-linear-to-b from-[#7370FF]/12 to-[#0e0e16] border-[#7370FF]/30"
      : "bg-[#101016] border-white/8",
  );

/** Card contents, shared by the desktop grid and the mobile stack. */
export function ServiceCardBody({ s }: { s: Service }) {
  return (
    <>
      {s.highlight && (
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-[#7370FF]/12 blur-[80px] rounded-full pointer-events-none" />
      )}
      <div className="relative z-10 flex flex-1 flex-col">
        <span
          aria-hidden="true"
          className={cn(
            "text-[2rem] md:text-[2.75rem] font-extrabold leading-none tracking-[-0.04em] tabular-nums transition-colors duration-300",
            s.highlight ? "text-[#A9A7FF] group-hover:text-[#C9C8FF]" : "text-[#7C79FF] group-hover:text-[#A9A7FF]",
          )}
        >
          {s.number}
        </span>
        <h3 className="mt-4 md:mt-8 text-[1.25rem] md:text-2xl font-bold leading-snug text-white tracking-[-0.01em] text-balance">
          {s.title}
        </h3>
        <p className="mt-2 md:mt-3 text-zinc-400 text-[15px] leading-relaxed max-w-[62ch]">{s.description}</p>
        <div className="mt-auto pt-5 md:pt-8 flex flex-wrap gap-2">
          {s.tags.map((tag) => (
            <span
              key={tag}
              className={cn(
                "text-xs font-semibold px-2.5 py-1 rounded-md border",
                s.highlight
                  ? "bg-[#7370FF]/14 border-[#7370FF]/35 text-[#D2D1FF]"
                  : "bg-white/5 border-white/10 text-zinc-300",
              )}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}

const HOLD = 0.09; // share of the pinned scroll each card rests on top

/** Scroll keyframes: each card rests (HOLD) then hands off to the next. */
function keyframes(n: number) {
  const move = (1 - n * HOLD) / (n - 1);
  const input: number[] = [];
  const output: number[] = [];
  for (let k = 0; k < n; k++) {
    const start = k * (HOLD + move);
    input.push(start, start + HOLD);
    output.push(k, k);
  }
  return { input, output };
}

function StackCard({ s, index, total, progress }: { s: Service; index: number; total: number; progress: MotionValue<number> }) {
  // d > 0: still in the stack (d cards deep). -1 < d < 0: flipping off the top.
  const depth = () => index - progress.get();

  const y = useTransform(() => {
    const d = depth();
    return d >= 0 ? `${Math.min(d, 2.5) * 12}px` : `${d * 6}%`;
  });
  const x = useTransform(() => {
    const d = depth();
    return d < 0 ? `${d * 112}%` : "0%";
  });
  const scale = useTransform(() => {
    const d = depth();
    return d >= 0 ? 1 - Math.min(d, 2.5) * 0.05 : 1;
  });
  const rotateY = useTransform(() => {
    const d = depth();
    return d < 0 ? d * 24 : 0;
  });
  const rotate = useTransform(() => {
    const d = depth();
    return d < 0 ? d * 9 : 0;
  });
  // Stay opaque while the card still covers the next one; fade only once it's mostly away.
  const opacity = useTransform(() => {
    const d = depth();
    if (d < -0.55) return Math.max(0, 1 + (d + 0.55) * 2.2);
    return d < 3 ? 1 : 0;
  });
  const dim = useTransform(() => {
    const d = depth();
    return d > 0 ? Math.min(d, 2) * 0.32 : 0;
  });

  return (
    <motion.div
      className={cn(serviceCardClass(s), "absolute inset-0 shadow-[0_-6px_24px_rgba(0,0,0,0.45)] will-change-transform")}
      style={{ x, y, scale, rotateY, rotate, opacity, zIndex: total - index, transformOrigin: "50% 100%" }}
    >
      <ServiceCardBody s={s} />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[1.75rem] bg-[#06060a]"
        style={{ opacity: dim }}
      />
    </motion.div>
  );
}

export function ServiceStack({ services, header }: { services: Service[]; header: ReactNode }) {
  const n = services.length;
  const trackRef = useRef<HTMLDivElement>(null);
  const { input, output } = keyframes(n);
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start start", "end end"] });
  const progress = useTransform(scrollYProgress, input, output);

  return (
    <div ref={trackRef} className="relative" style={{ height: `${100 + (n - 1) * 45}svh` }}>
      <div className="sticky top-0 flex h-[100svh] flex-col justify-center pt-20 pb-6">
        {header}
        <div
          className="relative mt-7 h-[min(372px,calc(100svh-300px))]"
          style={{ perspective: 1200 }}
          role="list"
          aria-label="Services"
        >
          {services.map((s, i) => (
            <div key={s.number} role="listitem" className="contents">
              <StackCard s={s} index={i} total={n} progress={progress} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { FiArrowUpRight } from "./icons";
import type { Project } from "./projects";

/*
 * Selected Work as a card stack.
 * Project cards sit in a loose pile. The stage pins and each scroll
 * step down throws the top card off to the back of the pile (each step up
 * brings the last one back). The previous / next buttons and arrow keys do the
 * same at any time; scroll moves the stack *relative* to where it is, so the
 * two never fight. The details beside the pile describe the card on top.
 */

const EASE = [0.22, 0.61, 0.36, 1] as const;
const TILTS = [-6, 5, -4, 7, -3]; // resting tilt of cards in the pile (deg)
const VISIBLE = 4; // cards drawn in the pile
const HOLD = 0.2; // share of the pinned scroll each card rests on top

/** Scroll keyframes: each card rests (HOLD) then hands off to the next. */
function keyframes(n: number) {
  if (n <= 1) return { input: [0, 1], output: [0, 0] };
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

const pad = (n: number) => String(n).padStart(2, "0");

function hostOf(url: string) {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

type Command = { id: number; card: number; kind: "throw" | "enter"; dir: 1 | -1 };

/* ---------- One card in the pile ---------- */

function PileCard({
  project,
  index,
  depth,
  total,
  command,
  reduce,
  onThrowStart,
  onThrown,
}: {
  project: Project;
  index: number;
  depth: number;
  total: number;
  command: Command | null;
  reduce: boolean;
  onThrowStart: () => void;
  onThrown: (dir: 1 | -1) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const throwRotate = useTransform(x, [-320, 320], [-14, 14]);
  const isTop = depth === 0;
  const busy = useRef(false);

  const distance = () => (ref.current?.offsetWidth ?? 600) * 0.82;

  const throwOut = async (dir: 1 | -1) => {
    if (busy.current) return;
    busy.current = true;
    onThrowStart();
    if (!reduce) await animate(x, dir * distance(), { duration: 0.28, ease: [0.32, 0, 0.67, 0] });
    onThrown(dir);
    // Now at the back of the pile: slide home behind the others.
    if (reduce) x.jump(0);
    else await animate(x, 0, { type: "spring", stiffness: 240, damping: 30 });
    busy.current = false;
  };

  // Programmatic throws (buttons / keys) and entrances (previous).
  useLayoutEffect(() => {
    if (!command || command.card !== index) return;
    if (command.kind === "throw") {
      void throwOut(command.dir);
    } else if (!reduce) {
      x.jump(-command.dir * distance());
      animate(x, 0, { type: "spring", stiffness: 260, damping: 30 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [command]);

  const side = depth % 2 === 1 ? -1 : 1;
  const pose = isTop
    ? { rotate: 0, x: 0, y: 0, scale: 1 }
    : {
        rotate: TILTS[index % TILTS.length],
        x: side * (16 + depth * 12),
        y: depth * 10,
        scale: 1 - depth * 0.05,
      };

  return (
    <motion.div
      className="absolute inset-0"
      style={{ zIndex: total - depth }}
      initial={false}
      animate={{ ...pose, opacity: depth < VISIBLE ? 1 : 0 }}
      transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30 }}
      aria-hidden={!isTop}
    >
      <motion.div ref={ref} className="h-full w-full" style={{ x, rotate: throwRotate }}>
        <div className="flex h-full w-full flex-col rounded-[1.6rem] border border-white/10 bg-[#0e0e14] p-2.5 shadow-[0_28px_60px_-14px_rgba(0,0,0,0.85)] select-none">
          <div className="flex h-full flex-col overflow-hidden rounded-[1.2rem] border border-white/8 bg-zinc-900">
            <div className="flex h-9 shrink-0 items-center gap-3 border-b border-white/6 bg-white/3 px-4">
              <div className="flex gap-1.5" aria-hidden="true">
                <span className="h-2.5 w-2.5 rounded-full bg-white/12" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/12" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/12" />
              </div>
              <span className="mx-auto max-w-[240px] flex-1 truncate rounded-md border border-white/6 bg-white/4 px-3 py-0.5 text-center text-[11px] font-medium text-zinc-500">
                {hostOf(project.url)}
              </span>
              <span className="w-[42px]" aria-hidden="true" />
            </div>
            <div className="relative flex-1">
              {project.image && (
                <Image
                  src={project.image}
                  alt={isTop ? `${project.name} homepage` : ""}
                  fill
                  draggable={false}
                  priority={index === 0}
                  sizes="(min-width: 768px) 46vw, 92vw"
                  className="pointer-events-none object-cover object-top"
                />
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ---------- Arrow button ---------- */

function NavButton({ dir, label, onClick }: { dir: 1 | -1; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-white/5 text-zinc-300 transition-colors duration-200 hover:border-white/25 hover:bg-white/12 hover:text-white active:scale-95"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ transform: dir === -1 ? "scaleX(-1)" : undefined }}
      >
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </svg>
    </button>
  );
}

/* ---------- Public component ---------- */

export default function ProjectSwipe({ projects }: { projects: Project[] }) {
  const reduce = useReducedMotion() ?? false;
  const n = projects.length;
  const [order, setOrder] = useState(() => projects.map((_, i) => i));
  const [command, setCommand] = useState<Command | null>(null);
  const seq = useRef(0);
  const orderRef = useRef(order);
  const busy = useRef(false); // a throw or entrance is in flight
  const pending = useRef(0); // scroll steps still to play (+ next, - previous)
  const top = order[0];
  const project = projects[top];

  useEffect(() => {
    orderRef.current = order;
  }, [order]);

  const scrollMode = !reduce;

  const rotate = (o: number[], dir: 1 | -1) =>
    dir === 1 ? [...o.slice(1), o[0]] : [o[o.length - 1], ...o.slice(0, -1)];

  const next = () => {
    busy.current = true;
    setCommand({ id: ++seq.current, card: orderRef.current[0], kind: "throw", dir: -1 });
  };

  const previous = () => {
    busy.current = true;
    const o = orderRef.current;
    const last = o[o.length - 1];
    orderRef.current = rotate(o, -1);
    setOrder(orderRef.current);
    setCommand({ id: ++seq.current, card: last, kind: "enter", dir: -1 });
    window.setTimeout(() => {
      busy.current = false;
      pump();
    }, reduce ? 0 : 260);
  };

  // Play queued scroll steps one card at a time.
  function pump() {
    if (busy.current || pending.current === 0) return;
    if (pending.current > 0) {
      pending.current -= 1;
      next();
    } else {
      pending.current += 1;
      previous();
    }
  }

  const onThrown = () => {
    orderRef.current = rotate(orderRef.current, 1);
    setOrder(orderRef.current);
    busy.current = false;
    window.setTimeout(pump, 40);
  };

  // Scroll-driven swapping (desktop): each step of the pinned scroll = one card.
  const trackRef = useRef<HTMLDivElement>(null);
  const { input, output } = keyframes(n);
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start start", "end end"] });
  const scrollStep = useTransform(scrollYProgress, input, output);
  const lastStep = useRef(0);

  // The step is read straight from the track's position on screen. Motion's
  // progress is only the change signal: before the track is first measured it
  // reports the end of the range, which would otherwise fake a jump of n cards.
  const currentStep = () => {
    const el = trackRef.current;
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    const range = r.height - window.innerHeight;
    const p = range > 0 ? Math.min(1, Math.max(0, -r.top / range)) : 0;
    let i = 0;
    while (i < input.length - 2 && p > input[i + 1]) i++;
    const [a, b] = [input[i], input[i + 1]];
    const t = b > a ? (p - a) / (b - a) : 0;
    return Math.round(output[i] + (output[i + 1] - output[i]) * Math.min(1, Math.max(0, t)));
  };

  useEffect(() => {
    pending.current = 0;
    if (scrollMode) lastStep.current = currentStep();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollMode]);

  useMotionValueEvent(scrollStep, "change", () => {
    if (!scrollMode) return;
    const step = currentStep();
    if (step === lastStep.current) return;
    pending.current += step - lastStep.current;
    lastStep.current = step;
    pump();
  });

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      next();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      previous();
    }
  };

  const stage = (
    <div className="grid w-full grid-cols-1 items-center gap-7 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-16">
      {/* Pile */}
      <div className="flex flex-col items-center gap-6">
        <div
          role="group"
          aria-roledescription="card stack"
          aria-label="Projects. Scroll, or use the previous and next buttons or arrow keys, to change project."
          tabIndex={0}
          onKeyDown={onKeyDown}
          className="relative w-[min(86%,calc((100svh-480px)*1.23))] md:w-full max-w-[640px] md:max-w-[min(640px,calc((100svh-300px)*1.23))] aspect-[4/3.25] rounded-[1.6rem] outline-offset-8"
        >
          {projects.map((p, i) => (
            <PileCard
              key={p.url}
              project={p}
              index={i}
              depth={order.indexOf(i)}
              total={n}
              command={command}
              reduce={reduce}
              onThrowStart={() => {
                busy.current = true;
              }}
              onThrown={onThrown}
            />
          ))}
        </div>
      </div>

      {/* Details of the card on top */}
      <div className="flex flex-col" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={project.url}
            initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            <p className="text-sm font-bold tabular-nums text-zinc-500">
              <span className="text-[#9C99FF]">{pad(top + 1)}</span> / {pad(n)}
            </p>
            <h3 className="mt-2 md:mt-3 text-[clamp(1.75rem,3.6vw,3.25rem)] font-extrabold leading-[1.05] tracking-[-0.02em] text-white">
              {project.name}
            </h3>
            <p className="mt-2 text-sm font-medium text-[#9C99FF] md:text-base">{project.category}</p>
            <p className="mt-4 max-w-[44ch] text-[15px] leading-relaxed text-zinc-400 line-clamp-3 md:mt-6 md:line-clamp-none md:text-lg">
              {project.description}
            </p>
            <div className="mt-7 hidden flex-wrap gap-2 md:flex">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-white/8 bg-white/3 px-3 py-1.5 text-[11px] font-semibold text-white/55"
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 flex flex-wrap items-center gap-3 md:mt-10">
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mr-3 inline-flex items-center gap-2.5 rounded-full bg-[#7370FF] px-6 py-3.5 text-sm font-bold text-white shadow-[0_8px_30px_rgba(115,112,255,0.4)] transition-colors duration-200 hover:bg-[#625df5]"
          >
            Visit {hostOf(project.url)}
            <FiArrowUpRight size={14} />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
          <NavButton dir={-1} label="Previous project" onClick={previous} />
          <NavButton dir={1} label="Next project" onClick={next} />
        </div>
      </div>
    </div>
  );

  return scrollMode ? (
    <div ref={trackRef} className="relative" style={{ height: `${100 + (n - 1) * 70}svh` }}>
      <div className="sticky top-0 flex h-[100svh] items-center pt-20 pb-6 md:pt-20">{stage}</div>
    </div>
  ) : (
    <div ref={trackRef}>{stage}</div>
  );
}

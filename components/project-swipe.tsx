"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
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

type Command = {
  id: number;
  card: number;
  kind: "throw" | "enter";
  dir: 1 | -1;
};

/* ---------- One card in the pile ---------- */

function PileCard({
  project,
  index,
  depth,
  total,
  command,
  reduce,
  mobile,
  onThrowStart,
  onThrown,
}: {
  project: Project;
  index: number;
  depth: number;
  total: number;
  command: Command | null;
  reduce: boolean;
  mobile: boolean;
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
    if (!reduce)
      await animate(x, dir * distance(), {
        duration: 0.28,
        ease: [0.32, 0, 0.67, 0],
      });
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
  // Mobile: same straight stack as the "What We Build" cards (edges peek out below).
  // Desktop: a loose, tilted pile.
  const pose = isTop
    ? { rotate: 0, x: 0, y: 0, scale: 1 }
    : mobile
      ? {
          rotate: 0,
          x: 0,
          y: Math.min(depth, 2.5) * 12,
          scale: 1 - Math.min(depth, 2.5) * 0.05,
        }
      : {
          rotate: TILTS[index % TILTS.length],
          x: side * (16 + depth * 12),
          y: depth * 10,
          scale: 1 - depth * 0.05,
        };

  return (
    <motion.div
      className="absolute inset-0"
      style={{
        zIndex: total - depth,
        transformOrigin: mobile ? "50% 100%" : "50% 50%",
      }}
      initial={false}
      animate={{ ...pose, opacity: depth < VISIBLE ? 1 : 0 }}
      transition={
        reduce
          ? { duration: 0 }
          : { type: "spring", stiffness: 300, damping: 30 }
      }
      aria-hidden={!isTop}
    >
      <motion.div
        ref={ref}
        className="h-full w-full"
        style={{ x, rotate: throwRotate }}
      >
        {mobile ? (
          <MobileCard
            project={project}
            index={index}
            total={total}
            isTop={isTop}
          />
        ) : (
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
        )}
        {mobile && depth > 0 && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[1.75rem] bg-[#06060a]"
            style={{ opacity: Math.min(depth, 2) * 0.32 }}
          />
        )}
      </motion.div>
    </motion.div>
  );
}

/* ---------- Mobile card (matches the "What We Build" service cards) ---------- */

function MobileCard({
  project,
  index,
  total,
  isTop,
}: {
  project: Project;
  index: number;
  total: number;
  isTop: boolean;
}) {
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[1.75rem] border border-white/8 bg-[#101016] p-3 shadow-[0_-6px_24px_rgba(0,0,0,0.45)] select-none">
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-[1.1rem] border border-white/8 bg-zinc-900">
        {project.image && (
          <Image
            src={project.image}
            alt={isTop ? `${project.name} homepage` : ""}
            fill
            draggable={false}
            priority={index === 0}
            sizes="92vw"
            className="pointer-events-none object-cover object-top"
          />
        )}
      </div>
      <div className="shrink-0 px-3 pt-4 pb-1.5 text-left">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-[1.25rem] font-bold leading-snug tracking-[-0.01em] text-white">
            {project.name}
          </h3>
          <span className="shrink-0 text-xs font-bold tabular-nums text-zinc-500">
            <span className="text-[#9C99FF]">{pad(index + 1)}</span> / {pad(total)}
          </span>
        </div>
        <p className="mt-0.5 text-sm font-medium text-[#9C99FF]">{project.category}</p>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-400 [@media(max-height:760px)]:hidden">
          {project.description}
        </p>
        {/* One row of tags, styled like the service cards; extra tags drop off rather than wrap. */}
        <ul className="mt-3 flex h-[1.625rem] flex-wrap gap-1.5 overflow-hidden" aria-label="Tags">
          {project.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold leading-none text-zinc-300"
            >
              {tag}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ---------- Arrow button ---------- */

function NavButton({
  dir,
  label,
  onClick,
}: {
  dir: 1 | -1;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border md:h-12 md:w-12 border-white/12 bg-white/5 text-zinc-300 transition-colors duration-200 hover:border-white/25 hover:bg-white/12 hover:text-white active:scale-95"
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

export default function ProjectSwipe({
  projects,
  header,
}: {
  projects: Project[];
  header?: ReactNode;
}) {
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
  const [mobile, setMobile] = useState(false);

  // Desktop: pin the cards vertically centred (a little below centre to clear the navbar).
  useEffect(() => {
    const el = stickyRef.current;
    if (!el || mobile || !scrollMode) return;
    const update = () =>
      setStickTopPx(
        Math.max(
          112,
          Math.round((window.innerHeight - el.offsetHeight) / 2 + 32),
        ),
      );
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [mobile, scrollMode]);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const rotate = (o: number[], dir: 1 | -1) =>
    dir === 1 ? [...o.slice(1), o[0]] : [o[o.length - 1], ...o.slice(0, -1)];

  const next = () => {
    busy.current = true;
    setCommand({
      id: ++seq.current,
      card: orderRef.current[0],
      kind: "throw",
      dir: -1,
    });
  };

  const previous = () => {
    busy.current = true;
    const o = orderRef.current;
    const last = o[o.length - 1];
    orderRef.current = rotate(o, -1);
    setOrder(orderRef.current);
    setCommand({ id: ++seq.current, card: last, kind: "enter", dir: -1 });
    window.setTimeout(
      () => {
        busy.current = false;
        pump();
      },
      reduce ? 0 : 260,
    );
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
  const stickyRef = useRef<HTMLDivElement>(null);
  const [stickTopPx, setStickTopPx] = useState(112);
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });
  const scrollStep = useTransform(scrollYProgress, input, output);
  const lastStep = useRef(0);

  // The step is read straight from the track's position on screen. Motion's
  // progress is only the change signal: before the track is first measured it
  // reports the end of the range, which would otherwise fake a jump of n cards.
  const currentStep = () => {
    const el = trackRef.current;
    const sticky = stickyRef.current;
    if (!el || !sticky) return 0;
    const r = el.getBoundingClientRect();
    const stickTop = parseFloat(getComputedStyle(sticky).top) || 0;
    const range = r.height - sticky.offsetHeight;
    const p =
      range > 0 ? Math.min(1, Math.max(0, (stickTop - r.top) / range)) : 0;
    let i = 0;
    while (i < input.length - 2 && p > input[i + 1]) i++;
    const [a, b] = [input[i], input[i + 1]];
    const t = b > a ? (p - a) / (b - a) : 0;
    return Math.round(
      output[i] + (output[i + 1] - output[i]) * Math.min(1, Math.max(0, t)),
    );
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
    <div className="grid w-full grid-cols-1 items-center gap-10 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-16">
      {/* Pile */}
      <div className="flex flex-col items-center gap-6">
        <div
          role="group"
          aria-roledescription="card stack"
          aria-label="Projects. Scroll, or use the previous and next buttons or arrow keys, to change project."
          tabIndex={0}
          onKeyDown={onKeyDown}
          className="relative w-full h-[min(372px,calc(100svh-330px))] md:h-auto max-w-[640px] md:max-w-[min(560px,calc((100svh-200px)*1.23))] md:aspect-[4/3.25] rounded-[1.75rem] md:rounded-[1.6rem] outline-offset-8"
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
              mobile={mobile}
              onThrowStart={() => {
                busy.current = true;
              }}
              onThrown={onThrown}
            />
          ))}
        </div>
      </div>

      {/* Details of the card on top */}
      <div
        className="flex flex-col items-center text-center md:items-start md:text-left"
        aria-live="polite"
      >
        {/* On mobile the name and description live inside the card itself. */}
        <div className="hidden w-full md:block">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={project.url}
              initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              <p className="text-sm font-bold tabular-nums text-zinc-500">
                <span className="text-[#9C99FF]">{pad(top + 1)}</span> /{" "}
                {pad(n)}
              </p>
              <h3 className="mt-2 md:mt-3 text-[clamp(1.75rem,3.6vw,3.25rem)] font-extrabold leading-[1.05] tracking-[-0.02em] text-white">
                {project.name}
              </h3>
              <p className="mt-2 text-sm font-medium text-[#9C99FF] md:text-base">
                {project.category}
              </p>
              <p className="mx-auto mt-4 max-w-[44ch] md:mx-0 text-[15px] leading-relaxed text-zinc-400 line-clamp-2 max-md:[@media(max-height:760px)]:hidden md:mt-6 md:line-clamp-none md:text-lg">
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
        </div>

        <div className="flex items-center justify-center gap-2.5 md:mt-10 md:justify-start md:gap-3">
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mr-1.5 md:mr-3 inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-[#7370FF] px-5 text-sm font-bold md:h-12 md:px-6 text-white shadow-[0_8px_30px_rgba(115,112,255,0.4)] transition-colors duration-200 hover:bg-[#625df5]"
          >
            Visit
            <FiArrowUpRight size={14} />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
          <NavButton dir={-1} label="Previous project" onClick={previous} />
          <NavButton dir={1} label="Next project" onClick={next} />
        </div>
      </div>
    </div>
  );

  // Mobile: heading and cards pin together in one screen, 28px apart (same as
  // the "What We Build" stack). Desktop: same rhythm as "What We Build" —
  // 128px top padding, heading, 96px gap — then only the cards pin, just
  // below the navbar, while the heading scrolls away.
  return scrollMode ? (
    <div className={mobile ? "" : "pt-32 pb-32"}>
      {!mobile && <div className="mb-24">{header}</div>}
      {/* The track element stays the same across layouts so the scroll tracker stays attached. */}
      <div
        ref={trackRef}
        className="relative"
        style={mobile ? { height: `${100 + (n - 1) * 70}svh` } : undefined}
      >
        <div
          ref={stickyRef}
          className={
            mobile
              ? "sticky top-0 flex h-[100svh] flex-col justify-center gap-7 pt-24 pb-12"
              : "sticky"
          }
          style={mobile ? undefined : { top: stickTopPx }}
        >
          {mobile && header}
          {stage}
        </div>
        {!mobile && (
          <div aria-hidden="true" style={{ height: `${(n - 1) * 70}svh` }} />
        )}
      </div>
    </div>
  ) : (
    <div
      ref={trackRef}
      className="flex flex-col gap-10 py-16 md:gap-16 md:py-32"
    >
      {header}
      {stage}
    </div>
  );
}

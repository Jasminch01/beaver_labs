"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";

/*
 * Hero visual: an isometric structure of modular blocks.
 * Blocks drop in and assemble, then a purple "next block" keeps landing in
 * open slots, like a beaver adding to its dam: the product getting built.
 * Blocks near the cursor lift and the whole structure leans toward it.
 */

const S = 38; // cube edge (viewBox units)
const W = S * Math.sqrt(3); // width of a top face
const EASE = [0.22, 0.61, 0.36, 1] as const;

// Heightmap, back row first. Rises toward the back-left like a skyline.
const HEIGHTS = [
  [4, 3, 3, 2, 1],
  [3, 3, 2, 2, 1],
  [3, 2, 2, 1, 1],
  [2, 2, 1, 1, 0],
  [1, 1, 1, 0, 0],
];

// Open slots, filled in this order (front to back, low to high).
// Each sits on a column whose front neighbours are no taller, so a landed
// block never needs to slip behind anything.
const SLOTS = [
  { r: 3, c: 3 },
  { r: 2, c: 1 },
  { r: 1, c: 2 },
  { r: 0, c: 1 },
  { r: 0, c: 0 },
].map((s) => ({ ...s, z: HEIGHTS[s.r][s.c] }));

// A couple of purple blocks already in place at the base.
const ACCENTS = new Set(["4-0-0", "2-4-0", "3-1-1"]);

type Tone = "base" | "accent";

const TONES: Record<Tone, { top: string; left: string; right: string; stroke: string }> = {
  base: {
    top: "#1f1e2c",
    left: "#15151f",
    right: "#0f0f17",
    stroke: "rgba(156,153,255,0.16)",
  },
  accent: {
    top: "#aeacff",
    left: "#7370FF",
    right: "#5450e2",
    stroke: "rgba(255,255,255,0.22)",
  },
};

function iso(r: number, c: number, z: number) {
  return { x: ((c - r) * W) / 2, y: ((c + r) * S) / 2 - z * S };
}

function faces(x: number, y: number) {
  const h = S / 2;
  return {
    top: `${x},${y - h} ${x + W / 2},${y} ${x},${y + h} ${x - W / 2},${y}`,
    left: `${x - W / 2},${y} ${x},${y + h} ${x},${y + h + S} ${x - W / 2},${y + S}`,
    right: `${x + W / 2},${y} ${x},${y + h} ${x},${y + h + S} ${x + W / 2},${y + S}`,
  };
}

type CubeSpec = { key: string; r: number; c: number; z: number; tone: Tone; landed?: boolean; order?: number };

function CubeFaces({ x, y, tone }: { x: number; y: number; tone: Tone }) {
  const f = faces(x, y);
  const t = TONES[tone];
  return (
    <>
      <polygon points={f.left} fill={t.left} stroke={t.stroke} strokeWidth={1} strokeLinejoin="round" />
      <polygon points={f.right} fill={t.right} stroke={t.stroke} strokeWidth={1} strokeLinejoin="round" />
      <polygon points={f.top} fill={t.top} stroke={t.stroke} strokeWidth={1} strokeLinejoin="round" />
    </>
  );
}

function Cube({
  spec,
  order,
  px,
  py,
  reduce,
}: {
  spec: CubeSpec;
  order: number;
  px: MotionValue<number>;
  py: MotionValue<number>;
  reduce: boolean;
}) {
  const { x, y } = iso(spec.r, spec.c, spec.z);

  // Lift blocks that sit near the cursor.
  const target = useTransform(() => {
    const d = Math.hypot(px.get() - x, py.get() - (y + S / 2));
    return d < 110 ? -(1 - d / 110) * 9 : 0;
  });
  const lift = useSpring(target, { stiffness: 260, damping: 22 });

  const entrance = spec.landed
    ? {
        initial: { opacity: 1, y: -6 },
        animate: { opacity: 1, y: 0 },
        transition: { type: "spring" as const, stiffness: 520, damping: 14 },
      }
    : {
        initial: reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: -70 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.7, delay: 0.35 + order * 0.028, ease: EASE },
      };

  return (
    <motion.g
      {...entrance}
      exit={{ opacity: 0, y: -46, transition: { duration: 0.6, ease: EASE } }}
    >
      <motion.g style={{ y: reduce ? 0 : lift }}>
        <CubeFaces x={x} y={y} tone={spec.tone} />
        {spec.landed && !reduce && (
          <motion.polygon
            points={faces(x, y).top}
            fill="none"
            stroke="#aeacff"
            strokeWidth={1.5}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
            initial={{ opacity: 0.9, scale: 1 }}
            animate={{ opacity: 0, scale: 2.1 }}
            transition={{ duration: 0.9, ease: EASE }}
          />
        )}
      </motion.g>
    </motion.g>
  );
}

function GhostSlot({ r, c, z }: { r: number; c: number; z: number }) {
  const { x, y } = iso(r, c, z);
  const f = faces(x, y);
  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      fill="rgba(115,112,255,0.06)"
      stroke="rgba(156,153,255,0.55)"
      strokeWidth={1}
      strokeDasharray="3 4"
      strokeLinejoin="round"
    >
      <polygon points={f.left} />
      <polygon points={f.right} />
      <polygon points={f.top} />
    </motion.g>
  );
}

export default function BlockStack({ className }: { className?: string }) {
  const reduce = useReducedMotion() ?? false;
  const rootRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Pointer in viewBox space (far away = no lift).
  const px = useMotionValue(9999);
  const py = useMotionValue(9999);

  // Lean toward the cursor.
  const tiltX = useSpring(0, { stiffness: 120, damping: 20 });
  const tiltY = useSpring(0, { stiffness: 120, damping: 20 });

  // Build loop.
  const [started, setStarted] = useState(false);
  const [filled, setFilled] = useState(0);
  const drop = useMotionValue(-130);
  const floatOpacity = useMotionValue(0);
  const bob = useMotionValue(0);
  const floatY = useTransform(() => {
    const d = drop.get();
    return d + bob.get() * Math.min(1, Math.max(0, -d / 64));
  });
  const shadowOpacity = useTransform(drop, [-130, 0], [0, 0.55]);

  useEffect(() => {
    const id = setTimeout(() => setStarted(true), 2100);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (reduce) return;
    const controls = animate(bob, [0, -5, 0], { duration: 2.4, repeat: Infinity, ease: "easeInOut" });
    return () => controls.stop();
  }, [bob, reduce]);

  useEffect(() => {
    if (!started || reduce) return;
    let alive = true;
    const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

    (async () => {
      if (filled < SLOTS.length) {
        drop.jump(-130);
        floatOpacity.jump(0);
        await Promise.all([
          animate(drop, -64, { duration: 0.9, ease: EASE }),
          animate(floatOpacity, 1, { duration: 0.5 }),
        ]);
        if (!alive) return;
        await wait(1000);
        if (!alive) return;
        await animate(drop, 0, { duration: 0.4, ease: [0.55, 0, 0.9, 0.4] });
        if (!alive) return;
        floatOpacity.jump(0);
        setFilled((n) => n + 1);
      } else {
        await wait(2800);
        if (!alive) return;
        setFilled(0);
      }
    })();

    return () => {
      alive = false;
    };
  }, [filled, started, reduce, drop, floatOpacity]);

  // Track the pointer on the hero's visual column.
  useEffect(() => {
    const host = rootRef.current?.parentElement;
    const svg = svgRef.current;
    if (!host || !svg) return;

    const onMove = (e: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      tiltY.set(((e.clientX - rect.left) / rect.width - 0.5) * 10);
      tiltX.set(-((e.clientY - rect.top) / rect.height - 0.5) * 8);
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
      px.set(p.x);
      py.set(p.y);
    };
    const onLeave = () => {
      tiltX.set(0);
      tiltY.set(0);
      px.set(9999);
      py.set(9999);
    };
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    return () => {
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, [px, py, tiltX, tiltY]);

  const cubes = useMemo(() => {
    const list: CubeSpec[] = [];
    HEIGHTS.forEach((row, r) =>
      row.forEach((h, c) => {
        for (let z = 0; z < h; z++) {
          const key = `${r}-${c}-${z}`;
          list.push({ key, r, c, z, tone: ACCENTS.has(key) ? "accent" : "base" });
        }
      }),
    );
    const showAll = reduce;
    SLOTS.slice(0, showAll ? SLOTS.length : filled).forEach((s) =>
      list.push({ key: `slot-${s.r}-${s.c}-${s.z}`, ...s, tone: "accent", landed: !showAll }),
    );
    // Painter's order: back to front, bottom to top.
    list.sort((a, b) => a.r + a.c - (b.r + b.c) || a.z - b.z);
    let order = 0;
    return list.map((spec) => (spec.landed ? spec : { ...spec, order: order++ }));
  }, [filled, reduce]);

  const next = !reduce && started && filled < SLOTS.length ? SLOTS[filled] : null;
  const nextPos = next ? iso(next.r, next.c, next.z) : null;

  return (
    <div
      ref={rootRef}
      className={`relative w-full h-full flex items-center justify-center [perspective:1400px] ${className ?? ""}`}
    >
      <motion.div
        className="w-full h-full max-w-[560px]"
        style={{ rotateX: reduce ? 0 : tiltX, rotateY: reduce ? 0 : tiltY, transformStyle: "preserve-3d" }}
      >
        <svg
          ref={svgRef}
          viewBox="-182 -252 364 456"
          className="w-full h-full overflow-visible"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <radialGradient id="bs-floor" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#7370FF" stopOpacity="0.35" />
              <stop offset="60%" stopColor="#7370FF" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#7370FF" stopOpacity="0" />
            </radialGradient>
            <filter id="bs-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="10" />
            </filter>
          </defs>

          {/* Floor glow under the structure */}
          <ellipse cx="0" cy="185" rx="230" ry="80" fill="url(#bs-floor)" />

          <AnimatePresence initial={true}>
            {cubes.map((spec) => (
              <Cube key={spec.key} spec={spec} order={spec.order ?? 0} px={px} py={py} reduce={reduce} />
            ))}
            {next && <GhostSlot key={`ghost-${next.r}-${next.c}`} {...next} />}
          </AnimatePresence>

          {/* Shadow cast on the target slot, darkening as the block falls */}
          {nextPos && (
            <motion.polygon
              points={faces(nextPos.x, nextPos.y).top}
              fill="#7370FF"
              style={{ opacity: shadowOpacity }}
              filter="url(#bs-glow)"
            />
          )}

          {/* The next block, hovering over its slot */}
          {nextPos && (
            <motion.g style={{ y: floatY, opacity: floatOpacity }}>
              <CubeFaces x={nextPos.x} y={nextPos.y} tone="accent" />
            </motion.g>
          )}
        </svg>
      </motion.div>
    </div>
  );
}

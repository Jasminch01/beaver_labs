"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import BlockStack from "./block-stack";
import { FiArrowDown, FiArrowUpRight, FiMail } from "./icons";
import ProjectSwipe from "./project-swipe";
import { PROJECTS } from "./projects";
import { scrollToId } from "./smooth-scroll";

const EASE = [0.22, 0.61, 0.36, 1] as const;

const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.75, delay, ease: EASE } },
});

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/* ---------- Cursor spotlight (same as live site) ---------- */

function Spotlight({ className, size = 500 }: { className?: string; size?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [parent, setParent] = useState<HTMLElement | null>(null);
  const mx = useSpring(useMotionValue(0), { bounce: 0, damping: 30, stiffness: 200 });
  const my = useSpring(useMotionValue(0), { bounce: 0, damping: 30, stiffness: 200 });
  const left = useTransform(mx, (v) => `${v - size / 2}px`);
  const top = useTransform(my, (v) => `${v - size / 2}px`);

  useEffect(() => {
    const el = ref.current?.parentElement;
    if (el) {
      el.style.position = "relative";
      setParent(el);
    }
  }, []);

  const onMove = useCallback(
    (e: MouseEvent) => {
      if (!parent) return;
      const { left, top } = parent.getBoundingClientRect();
      mx.set(e.clientX - left);
      my.set(e.clientY - top);
    },
    [mx, my, parent],
  );

  useEffect(() => {
    if (!parent) return;
    const enter = () => setVisible(true);
    const leave = () => setVisible(false);
    parent.addEventListener("mousemove", onMove);
    parent.addEventListener("mouseenter", enter);
    parent.addEventListener("mouseleave", leave);
    return () => {
      parent.removeEventListener("mousemove", onMove);
      parent.removeEventListener("mouseenter", enter);
      parent.removeEventListener("mouseleave", leave);
    };
  }, [parent, onMove]);

  return (
    <motion.div
      ref={ref}
      className={cn(
        "pointer-events-none absolute rounded-full blur-3xl transition-opacity duration-300 z-[1]",
        "bg-[radial-gradient(circle_at_center,rgba(115,112,255,0.28)_0%,rgba(156,153,255,0.12)_45%,transparent_70%)]",
        visible ? "opacity-100" : "opacity-0",
        className,
      )}
      style={{ width: size, height: size, left, top }}
    />
  );
}

/* ---------- Why on demand: letters fill with purple on scroll ---------- */

const WHY = [
  "From idea to MVP in weeks, not quarters.",
  "No bloat. No overhead. Just delivery.",
  "Full-stack capability at startup speed.",
  "Your vision, our execution. On demand.",
];

function FillChar({
  char,
  progress,
  from,
  to,
}: {
  char: string;
  progress: MotionValue<number>;
  from: number;
  to: number;
}) {
  const color = useTransform(progress, [from, to], ["rgba(255, 255, 255, 0.85)", "#7370FF"]);
  return <motion.span style={{ color }}>{char}</motion.span>;
}

function FillText({
  text,
  progress,
  start,
  end,
}: {
  text: string;
  progress: MotionValue<number>;
  start: number;
  end: number;
}) {
  const chars = text.split("");
  const step = (end - start) / chars.length;
  return (
    <span className="relative inline-block whitespace-pre-wrap" aria-label={text}>
      <span aria-hidden="true">
        {chars.map((ch, i) => (
          <FillChar key={i} char={ch} progress={progress} from={start + i * step} to={start + (i + 1) * step} />
        ))}
      </span>
    </span>
  );
}

/* ---------- Services ---------- */

const SERVICES = [
  {
    number: "01",
    title: "Web Applications & MVPs",
    description:
      "Blazing-fast web apps and SaaS platforms built with Next.js, TypeScript, and Tailwind CSS. From zero to a shippable MVP, we move fast and iterate faster.",
    tags: ["Next.js", "TypeScript", "React", "Tailwind CSS", "Node.js"],
    className: "md:col-span-2",
    highlight: false,
  },
  {
    number: "02",
    title: "Enterprise Internal Tools",
    description:
      "Custom dashboards, admin portals, and workflow systems that replace slow spreadsheets and outdated legacy software.",
    tags: ["Dashboards", "Admin Portals", "Workflows"],
    className: "md:col-span-1",
    highlight: false,
  },
  {
    number: "03",
    title: "RAG & Generative AI",
    description:
      "Production-grade AI products powered by LLMs and retrieval-augmented generation, built to deliver accurate, grounded answers at scale.",
    tags: ["LLMs", "RAG", "Vector DBs", "Embeddings", "OpenAI"],
    className: "md:col-span-1",
    highlight: true,
  },
  {
    number: "04",
    title: "Agentic AI Systems",
    description:
      "Multi-agent architectures that reason, plan, and act autonomously. We build AI that works for your business around the clock without human intervention.",
    tags: ["AI Agents", "Multi-Agent", "LangChain", "AutoGen"],
    className: "md:col-span-1",
    highlight: true,
  },
  {
    number: "05",
    title: "Business Automation",
    description:
      "End-to-end automation of repetitive workflows, data processing, and business operations, saving your team hours every single day.",
    tags: ["n8n", "Zapier", "Custom Pipelines", "Webhooks"],
    className: "md:col-span-1",
    highlight: false,
  },
  {
    number: "06",
    title: "API & Business Integrations",
    description:
      "Seamless connections between your tools, CRMs, ERPs, and third-party APIs. Everything your business runs on, unified under one roof.",
    tags: ["REST APIs", "GraphQL", "CRM / ERP", "Microservices"],
    className: "md:col-span-1",
    highlight: false,
  },
  {
    number: "07",
    title: "AWS Infrastructure & Data Pipelines",
    description:
      "Scalable cloud architecture, CI/CD pipelines, and data engineering built to carry your product from MVP to enterprise without missing a beat.",
    tags: ["AWS", "Redshift", "Glue", "Lambda", "RDS", "S3", "Fargate"],
    className: "md:col-span-2",
    highlight: false,
  },
];

/* ---------- Sticky-stack height helper ---------- */

function useBlockSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setSize(entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height);
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

/* ---------- Page ---------- */

export default function Home({ year }: { year: number }) {
  const [servicesRef, servicesH] = useBlockSize<HTMLElement>();
  const [workRef, workH] = useBlockSize<HTMLElement>();
  const [whyRef, whyH] = useBlockSize<HTMLElement>();
  const spacerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress: desktopProgress } = useScroll({
    target: spacerRef,
    offset: ["start end", "end end"],
  });
  const { scrollYProgress: mobileProgress } = useScroll({
    target: spacerRef,
    offset: ["start 65%", "end 20%"],
  });

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const progress = isMobile ? mobileProgress : desktopProgress;

  const stickTop = (h: number, fallback = "0px") =>
    h > 0 ? `min(0px, calc(100svh - ${h}px))` : fallback;

  return (
    <div className="bg-zinc-950">
      {/* ---------------- Hero ---------------- */}
      <section
        id="hero"
        className="relative md:sticky md:top-0 z-0 min-h-[100svh] bg-zinc-950 flex items-center overflow-hidden"
      >
        <div className="hidden md:block absolute top-1/3 left-1/4 w-[500px] h-[400px] bg-[#7370FF]/12 blur-[130px] rounded-full pointer-events-none" />
        <div className="hidden md:block absolute bottom-1/4 right-1/4 w-[400px] h-[300px] bg-[#9C99FF]/8 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl w-full mx-auto px-6 md:px-10 xl:px-0 pt-24 pb-12 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-4 items-center relative">
          <div className="relative z-10">
            <motion.div
              variants={fadeUp(0)}
              initial="hidden"
              animate="visible"
              className="flex items-center gap-3 mb-8"
            >
              <span className="w-2 h-2 rounded-full bg-[#7370FF] animate-pulse" />
              <span className="text-[11px] font-bold tracking-[0.22em] uppercase text-[#7370FF]">
                Product Design <span className="text-white"> &amp; Engineering Studio</span>
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp(0.1)}
              initial="hidden"
              animate="visible"
              className="text-[clamp(2.8rem,7vw,5.5rem)] font-extrabold text-white tracking-[-0.03em] leading-[1.0] mb-6"
            >
              Your Agile
              <br />
              Tech Team, <span className="text-[#7370FF]">On</span>
              <br />
              <span className="text-[#7370FF]">Demand.</span>
            </motion.h1>

            <motion.p
              variants={fadeUp(0.2)}
              initial="hidden"
              animate="visible"
              className="text-zinc-400 text-base md:text-lg max-w-md leading-relaxed mb-10"
            >
              From idea to MVP to scale, without the hassle and overhead of slow, traditional teams. We are a
              full-stack engineering studio specializing in cutting-edge web, AI, and cloud solutions.
            </motion.p>

            <motion.div
              variants={fadeUp(0.3)}
              initial="hidden"
              animate="visible"
              className="flex flex-wrap gap-3 mb-12"
            >
              <button
                type="button"
                onClick={() => scrollToId("contact")}
                className="flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-[#7370FF] text-white text-sm font-bold hover:bg-[#625df5] active:scale-[0.98] transition-all duration-200 shadow-[0_8px_30px_rgba(115,112,255,0.4)]"
              >
                Let&apos;s talk
                <FiArrowDown size={14} />
              </button>
              <a
                href="mailto:hello@beaverlabs.com"
                className="flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-white/8 border border-white/15 text-white text-sm font-bold hover:bg-white/14 hover:border-white/25 transition-all duration-200"
              >
                Start a project
                <FiArrowUpRight size={14} />
              </a>
            </motion.div>

            <motion.div variants={fadeUp(0.4)} initial="hidden" animate="visible" className="flex flex-wrap gap-3">
              {[
                { num: "100+", label: "Projects" },
                { num: "30K+", label: "Users" },
                { num: "5+", label: "Countries" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-baseline gap-1.5 bg-white/6 border border-white/10 rounded-full px-4 py-2"
                >
                  <span className="text-white font-bold text-base">{stat.num}</span>
                  <span className="text-zinc-500 text-xs font-medium">{stat.label}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Hero visual: modular blocks (replaces the Spline robot) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.3, ease: EASE }}
            className="absolute inset-0 md:relative md:inset-auto h-[100svh] md:h-[580px] w-full z-0 md:z-auto pointer-events-none md:pointer-events-auto flex items-center justify-center overflow-hidden md:overflow-visible"
          >
            <div className="w-full h-full opacity-25 md:opacity-100 scale-150 md:scale-100 transition-opacity duration-1000 mt-20 md:mt-0 relative">
              <Spotlight size={550} className="hidden md:block" />
              <BlockStack className="relative z-[2]" />
              <div className="absolute inset-0 bg-zinc-950/50 md:hidden pointer-events-none z-10" />
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}>
            <FiArrowDown size={16} className="text-zinc-500" />
          </motion.div>
        </motion.div>
      </section>

      {/* ---------------- Why on demand ---------------- */}
      <section
        id="why"
        ref={whyRef}
        className="relative md:sticky z-10 min-h-0 md:min-h-[100svh] bg-zinc-950 rounded-t-[2.5rem] overflow-hidden shadow-[0_-8px_40px_rgba(0,0,0,0.6)] flex items-center md:top-[var(--dynamic-top)]"
        style={{ "--dynamic-top": stickTop(whyH) } as CSSProperties}
      >
        <div className="hidden md:block absolute top-1/2 left-1/3 w-[600px] h-[400px] bg-[#7370FF]/10 blur-[150px] rounded-full pointer-events-none -translate-y-1/2" />
        <div className="max-w-7xl w-full mx-auto px-6 md:px-10 xl:px-0 py-24">
          <div className="mb-16">
            <h2 className="text-[#7370FF] text-[11px] font-bold tracking-[0.22em] uppercase">Why on demand</h2>
          </div>
          <div>
            {WHY.map((text, i) => {
              const start = 0.25 * i;
              return (
                <div key={i} className="py-5 md:py-9 border-b border-white/6 last:border-0 group cursor-default">
                  <span className="text-[11px] font-bold text-white/15 tabular-nums mr-6 select-none">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[clamp(1.5rem,4vw,3.2rem)] font-bold leading-tight tracking-[-0.01em]">
                    {isMobile ? (
                      <span className="text-white/85 whitespace-pre-wrap">{text}</span>
                    ) : (
                      <FillText text={text} progress={progress} start={start} end={start + 0.25} />
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div ref={spacerRef} className="hidden md:block h-[200svh] w-full" />

      {/* ---------------- Services ---------------- */}
      <section
        id="services"
        ref={servicesRef}
        className="relative md:sticky z-20 bg-[#0a0a0f] rounded-t-[2.5rem] overflow-hidden shadow-[0_-8px_40px_rgba(0,0,0,0.4)] md:top-[var(--services-top)]"
        style={{ "--services-top": stickTop(servicesH, "min(0px, calc(100svh - 100%))") } as CSSProperties}
      >
        <div className="hidden md:block absolute top-0 right-1/4 w-[500px] h-[300px] bg-[#7370FF]/6 blur-[130px] rounded-full pointer-events-none" />
        <div className="max-w-7xl w-full mx-auto px-6 md:px-10 xl:px-0 py-20 md:py-32">
          <motion.div
            initial={isMobile ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: isMobile ? 0 : 0.7 }}
            className="flex flex-col items-center text-center mb-16 md:mb-24 relative z-10"
          >
            <h2 className="text-[clamp(2.5rem,6vw,4.5rem)] font-extrabold text-white tracking-[-0.02em] leading-tight mb-5">
              What We <span className="text-[#7370FF]">Build</span>
            </h2>
            <p className="text-zinc-400 text-lg md:text-xl max-w-2xl">
              End-to-end capabilities across product, AI, and infrastructure.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
            {SERVICES.map((s, i) => (
              <motion.div
                key={s.number}
                initial={isMobile ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: isMobile ? "50px" : "-40px" }}
                transition={{ duration: isMobile ? 0 : 0.6, delay: isMobile ? 0 : 0.08 * i }}
                className={cn(
                  "group relative flex flex-col p-8 md:p-10 rounded-[2rem] border transition-[transform,border-color,background-color,box-shadow] duration-300 md:hover:-translate-y-1 overflow-hidden min-h-[360px] cursor-default",
                  s.highlight
                    ? "bg-linear-to-b from-[#7370FF]/8 to-zinc-950/50 border-[#7370FF]/25 hover:border-[#7370FF]/50 hover:shadow-[0_8px_32px_rgba(115,112,255,0.15)]"
                    : "bg-white/2 border-white/6 hover:bg-white/4 hover:border-white/10",
                  s.className,
                )}
              >
                {s.highlight && (
                  <div className="hidden md:block absolute top-0 right-0 w-64 h-64 bg-[#7370FF]/10 blur-[80px] rounded-full mix-blend-screen pointer-events-none transition-opacity duration-500 group-hover:opacity-100 opacity-60" />
                )}
                <div className="flex justify-between items-start mb-10 relative z-10">
                  <span
                    className={cn(
                      "text-[2.5rem] md:text-[3.2rem] font-black leading-none tracking-tighter select-none transition-colors duration-500",
                      s.highlight
                        ? "text-[#7370FF]/40 group-hover:text-[#7370FF]/60"
                        : "text-white/10 group-hover:text-white/20",
                    )}
                  >
                    {s.number}
                  </span>
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-400",
                      s.highlight
                        ? "border-[#7370FF]/30 text-[#7370FF] group-hover:bg-[#7370FF]/10"
                        : "border-white/10 text-white/30 group-hover:border-white/20 group-hover:text-white/70",
                    )}
                  >
                    <FiArrowUpRight size={18} className="group-hover:rotate-45 transition-transform duration-400" />
                  </div>
                </div>
                <div className="relative z-10 flex-1 flex flex-col">
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-3 tracking-[-0.01em]">{s.title}</h3>
                  <p className="text-zinc-400 text-[14px] md:text-[15px] leading-relaxed mb-8">{s.description}</p>
                  <div className="mt-auto flex flex-wrap gap-2 pt-4">
                    {s.tags.map((tag) => (
                      <span
                        key={tag}
                        className={cn(
                          "text-[11px] font-semibold px-3 py-1.5 rounded-md border transition-colors duration-400",
                          s.highlight
                            ? "bg-[#7370FF]/10 border-[#7370FF]/25 text-[#7370FF]/90 group-hover:border-[#7370FF]/40"
                            : "bg-white/3 border-white/6 text-white/50 group-hover:border-white/12 group-hover:text-white/70",
                        )}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Work (new) ---------------- */}
      <section
        id="work"
        ref={workRef}
        className="relative md:sticky z-30 bg-zinc-950 rounded-t-[2.5rem] overflow-clip shadow-[0_-8px_40px_rgba(0,0,0,0.5)] md:top-[var(--work-top)]"
        style={{ "--work-top": stickTop(workH, "min(0px, calc(100svh - 100%))") } as CSSProperties}
      >
        <div className="hidden md:block absolute top-0 left-1/4 w-[500px] h-[300px] bg-[#7370FF]/8 blur-[130px] rounded-full pointer-events-none" />
        <div className="max-w-7xl w-full mx-auto px-6 md:px-10 xl:px-0 py-20 md:py-32">
          <motion.div
            initial={isMobile ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: isMobile ? 0 : 0.7 }}
            className="flex flex-col items-center text-center mb-16 md:mb-24 relative z-10"
          >
            <h2 className="text-[clamp(2.5rem,6vw,4.5rem)] font-extrabold text-white tracking-[-0.02em] leading-tight mb-5">
              Work We&apos;ve <span className="text-[#7370FF]">Shipped</span>
            </h2>
            <p className="text-zinc-400 text-lg md:text-xl max-w-2xl">
              A few of the products we&apos;ve designed, engineered, and launched.
            </p>
          </motion.div>

          <div className="relative z-10">
            <ProjectSwipe projects={PROJECTS} />
          </div>
        </div>
      </section>

      {/* ---------------- Contact ---------------- */}
      <section
        id="contact"
        className="relative md:sticky md:top-0 z-50 min-h-[100svh] bg-zinc-950 rounded-t-[2.5rem] overflow-hidden shadow-[0_-8px_60px_rgba(0,0,0,0.7)] flex items-center justify-center"
      >
        <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[#7370FF]/14 blur-[160px] rounded-full pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(#7370FF 1px, transparent 1px), linear-gradient(90deg, #7370FF 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="max-w-7xl w-full mx-auto px-6 md:px-10 xl:px-0 text-center relative z-10">
          <motion.div
            initial={isMobile ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: isMobile ? 0 : 0.9 }}
          >
            <span className="text-[#7370FF] text-[11px] font-bold tracking-[0.22em] uppercase block mb-10">
              Get in touch
            </span>
            <h2 className="text-[clamp(2.5rem,7vw,6.5rem)] font-extrabold text-white tracking-[-0.03em] leading-[1.02] mb-8 max-w-4xl mx-auto">
              Ready to Build
              <br />
              <span className="text-[#7370FF]">Something Real?</span>
            </h2>
            <p className="text-zinc-500 text-lg max-w-sm mx-auto leading-relaxed mb-14">
              No forms. No waiting. Email us and we&apos;ll get back within 24 hours.
            </p>
            <motion.a
              href="mailto:hello@beaverlabs.com"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-[#7370FF] text-white font-bold text-base hover:bg-[#625df5] transition-colors duration-200 shadow-[0_0_40px_rgba(115,112,255,0.5)] hover:shadow-[0_0_60px_rgba(115,112,255,0.7)]"
            >
              <FiMail size={16} />
              hello@beaverlabs.com
            </motion.a>
            <div className="mt-20 pt-8 border-t border-white/8 flex flex-col sm:flex-row items-center justify-between gap-4 text-zinc-600 text-xs max-w-7xl mx-auto px-0">
              <span className="font-bold text-zinc-400">Beaver Labs</span>
              <span>© {year} Beaver Labs. All rights reserved.</span>
              <span>hello@beaverlabs.com</span>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

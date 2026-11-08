"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { scrollToId } from "./smooth-scroll";
import {
  IconBriefcase,
  IconBulb,
  IconHome,
  IconMail,
  IconNavbarCollapse,
  IconStack,
} from "./icons";

const SECTIONS = ["hero", "why", "services", "work", "contact"] as const;

type NavItem = { title: string; href: string; icon: ReactNode; isActive: boolean };

function handleAnchor(href: string) {
  const match = href.match(/#(.+)$/);
  return match ? scrollToId(match[1]) : false;
}

function DesktopItem({ title, icon, href, isActive }: NavItem) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href={href}
      aria-label={title}
      aria-current={isActive ? "location" : undefined}
      className="rounded-full"
      onClick={(e) => {
        if (handleAnchor(href)) e.preventDefault();
      }}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`relative w-10 h-10 flex items-center justify-center rounded-full transition-[background-color,border-color,box-shadow] duration-300 ${
          isActive
            ? "bg-[#7370FF]/20 shadow-[0_0_14px_rgba(115,112,255,0.45)] border border-[#7370FF]/35 text-white"
            : "bg-white/8 border border-white/8 hover:bg-white/15 hover:border-white/15 text-zinc-400 hover:text-white"
        }`}
      >
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: -6, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: -2, x: "-50%" }}
              transition={{ duration: 0.15 }}
              className="absolute top-full mt-2 left-1/2 w-fit rounded-md border border-white/10 bg-zinc-900/90 backdrop-blur-md px-2.5 py-1 text-[11px] font-semibold whitespace-pre text-white shadow-xl z-50"
            >
              {title}
            </motion.div>
          )}
        </AnimatePresence>
        <div className="w-5 h-5 flex items-center justify-center transition-colors duration-300">
          {icon}
        </div>
      </div>
    </Link>
  );
}

function MobileNav({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative block md:hidden z-50">
      <AnimatePresence>
        {open && (
          <motion.div
            layoutId="nav"
            className="absolute right-0 top-full mt-2 flex flex-col gap-2 bg-zinc-900/90 backdrop-blur-md p-3 rounded-2xl border border-white/10"
          >
            {items.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10, transition: { delay: 0.05 * i } }}
                transition={{ delay: (items.length - 1 - i) * 0.05 }}
              >
                <Link
                  href={item.href}
                  aria-label={item.title}
                  onClick={(e) => {
                    if (handleAnchor(item.href)) e.preventDefault();
                    setOpen(false);
                  }}
                  className={`flex h-10 w-10 items-center justify-center rounded-full transition-[background-color,border-color,box-shadow] duration-300 ${
                    item.isActive
                      ? "bg-[#7370FF]/25 shadow-[0_0_14px_rgba(115,112,255,0.45)] border border-[#7370FF]/40 text-white"
                      : "bg-white/5 border border-white/8 text-zinc-400 hover:text-white hover:bg-white/12"
                  }`}
                >
                  <div className="h-5 w-5 flex items-center justify-center">{item.icon}</div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-colors"
      >
        <IconNavbarCollapse className="h-5 w-5" />
      </button>
    </div>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<(typeof SECTIONS)[number]>("hero");

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      let current: (typeof SECTIONS)[number] = "hero";
      for (const id of SECTIONS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= window.innerHeight / 3) current = id;
      }
      if (window.scrollY < 100) current = "hero";
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const items: NavItem[] = [
    { title: "Home", href: "/#hero", icon: <IconHome className="h-full w-full" />, isActive: active === "hero" },
    { title: "Why Us", href: "/#why", icon: <IconBulb className="h-full w-full" />, isActive: active === "why" },
    { title: "Services", href: "/#services", icon: <IconBriefcase className="h-full w-full" />, isActive: active === "services" },
    { title: "Work", href: "/#work", icon: <IconStack className="h-full w-full" />, isActive: active === "work" },
    { title: "Contact", href: "/#contact", icon: <IconMail className="h-full w-full" />, isActive: active === "contact" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[100] px-4 pointer-events-none transition-all duration-1000 ${
        scrolled ? "pt-4 md:pt-6" : "pt-0"
      }`}
    >
      <div className="max-w-7xl mx-auto w-full flex justify-end">
        <nav
          aria-label="Main"
          className={`pointer-events-auto flex items-center justify-between w-full transition-all duration-1000 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            scrolled
              ? "max-w-[320px] md:max-w-[500px] rounded-full py-2 px-5 shadow-[0_8px_30px_rgba(0,0,0,0.5)] border bg-[#0a0a0a]/80 backdrop-blur-xl border-white/10"
              : "max-w-7xl rounded-none py-3 md:py-4 px-6 md:px-10 xl:px-0 border-transparent bg-transparent"
          }`}
        >
          <Link
            href="/"
            className="text-white text-2xl tracking-tight transition-colors duration-500 rounded-md"
          >
            <span className="text-[#7370FF] font-bold">beaver</span>labs.
          </Link>
          <div className="flex items-center justify-end">
            <div className="hidden md:flex h-14 items-center gap-2 rounded-2xl bg-transparent px-0">
              {items.map((item) => (
                <DesktopItem key={item.title} {...item} />
              ))}
            </div>
            <MobileNav items={items} />
          </div>
        </nav>
      </div>
    </header>
  );
}

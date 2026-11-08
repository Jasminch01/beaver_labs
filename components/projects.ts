/**
 * Selected Work — edit this list to add or change projects.
 *
 * For each project:
 *  - url:   live site link
 *  - image: screenshot path in /public, e.g. "/projects/acme.jpg" (4:3, e.g. 1800×1350, works best)
 *
 * Projects show as big cards in this order. On desktop they start as a stacked
 * deck and open one by one as the visitor scrolls.
 */
export type Project = {
  name: string;
  category: string;
  description: string;
  url: string;
  image?: string;
  tags: string[];
};

export const PROJECTS: Project[] = [
  {
    name: "Shiftly AI",
    category: "Staff scheduling SaaS",
    description:
      "Plan staff rosters, manage shift checklists, stock orders and compliance logs, and track hours for your café, bar or shop. Ask the built-in AI Assistant.",
    url: "https://www.joinshiftly.com",
    image: "/projects/shiftly-ai.jpg",
    tags: ["Next.js", "AI Assistant", "SaaS", "Scheduling"],
  },
  {
    name: "RGS Market",
    category: "Gaming marketplace",
    description:
      "Bangladesh's marketplace for buying and selling game accounts, diamonds and top-ups, with bKash and Nagad payments and escrow protection.",
    url: "https://rgsmarket.com",
    image: "/projects/rgs-market.jpg",
    tags: ["Next.js", "Supabase", "Marketplace", "Escrow", "bKash / Nagad"],
  },
  {
    name: "CHT Vanguard",
    category: "News portal",
    description:
      "A Bangla news portal covering Rangamati, Khagrachari and Bandarban in the Chittagong Hill Tracts, alongside national and international news.",
    url: "https://www.chtvanguard.com",
    image: "/projects/cht-vanguard.jpg",
    tags: ["Next.js", "News Portal", "Bangla"],
  },
];

/**
 * Selected Work — edit this list to add real projects.
 *
 * For each project:
 *  - url:   live site link (leave "" while it's a placeholder)
 *  - image: screenshot path in /public, e.g. "/projects/acme.jpg" (1600×1000 works well)
 *  - span:  "wide" takes two columns on desktop, "narrow" takes one
 *
 * Entries with `placeholder: true` render as clearly marked empty slots.
 */
export type Project = {
  name: string;
  description: string;
  url: string;
  image?: string;
  tags: string[];
  span: "wide" | "narrow";
  placeholder?: boolean;
};

export const PROJECTS: Project[] = [
  {
    name: "Project name",
    description: "One-line description of what we built and the result it delivered.",
    url: "",
    tags: ["Next.js", "AI", "AWS"],
    span: "wide",
    placeholder: true,
  },
  {
    name: "Project name",
    description: "One-line description of what we built and the result it delivered.",
    url: "",
    tags: ["Dashboard", "Automation"],
    span: "narrow",
    placeholder: true,
  },
  {
    name: "Project name",
    description: "One-line description of what we built and the result it delivered.",
    url: "",
    tags: ["RAG", "LLMs"],
    span: "narrow",
    placeholder: true,
  },
  {
    name: "Project name",
    description: "One-line description of what we built and the result it delivered.",
    url: "",
    tags: ["SaaS", "Integrations", "Data"],
    span: "wide",
    placeholder: true,
  },
];

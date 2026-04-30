import Link from "next/link";
import { ArrowRight, FileText, Sparkles, Wand2, Zap } from "lucide-react";

export const metadata = {
  title: "Free tools",
  description: "Free reading and writing utilities from the QuickGist newsroom — summarize articles, draft headlines, simplify jargon."
};

const tools = [
  {
    href: "/tools/summarize",
    title: "Article summarizer",
    description:
      "Paste any article — long-read, research paper, dense brief — and get a clean three-bullet summary plus key terms.",
    Icon: FileText,
    available: true
  },
  {
    href: "#",
    title: "Headline generator",
    description: "Produce 6 SEO-tight headline variants for any topic. Currently in private beta.",
    Icon: Wand2,
    available: false
  },
  {
    href: "#",
    title: "Jargon translator",
    description: "Drop in dense legal or technical text and get a plain-English version with definitions inline.",
    Icon: Sparkles,
    available: false
  }
];

export default function ToolsPage() {
  return (
    <>
      <section className="border-b border-line bg-gradient-to-br from-white via-paper to-accent/5">
        <div className="container-wide px-4 py-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
            <Zap size={12} />
            Free utilities
          </div>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-ink md:text-5xl">
            Useful, free reading tools.
          </h1>
          <p className="mt-3 max-w-2xl text-ink/65">
            Built from the same pipeline that powers our newsroom. Free forever for personal use, no signup required.
          </p>
        </div>
      </section>
      <section className="container-wide px-4 py-12">
        <div className="grid gap-5 md:grid-cols-3">
          {tools.map(({ href, title, description, Icon, available }) => (
            <Link
              key={title}
              href={available ? href : "#"}
              aria-disabled={!available}
              className={`story-card group flex flex-col gap-4 rounded-2xl border border-line bg-white p-6 ${
                available ? "" : "pointer-events-none opacity-65"
              }`}
            >
              <span className="grid h-11 w-11 place-items-center rounded-md bg-accent/10 text-accent">
                <Icon size={20} />
              </span>
              <div>
                <h2 className="font-display text-xl font-bold text-ink group-hover:text-accent">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-ink/65">{description}</p>
              </div>
              {available ? (
                <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-accent">
                  Open tool <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
                </span>
              ) : (
                <span className="mt-auto rounded-full bg-paper px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/55 w-fit">
                  Coming soon
                </span>
              )}
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

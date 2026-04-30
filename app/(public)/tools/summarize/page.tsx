import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { SummarizerTool } from "@/components/SummarizerTool";

export const metadata = {
  title: "Free news summarizer",
  description: "Paste any article and get a short, clean summary in seconds — free, no signup."
};

export default function SummarizePage() {
  return (
    <div className="container-wide px-4 py-12">
      <Link href="/tools" className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-ink">
        <ArrowLeft size={14} />
        All tools
      </Link>
      <div className="mt-6 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-md bg-accent/10 text-accent">
          <FileText size={20} />
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Free tool</p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">News summarizer</h1>
        </div>
      </div>
      <p className="mt-4 max-w-2xl text-ink/65">
        Paste any article — long-read, research paper, press release — and get a fast 3-bullet summary you can scan in
        under 30 seconds. No login, no rate limits for personal use.
      </p>
      <div className="mt-8">
        <SummarizerTool />
      </div>
    </div>
  );
}

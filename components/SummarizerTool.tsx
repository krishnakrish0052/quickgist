"use client";

import { useMemo, useState } from "react";
import { ClipboardList } from "lucide-react";

function summarize(value: string): string[] {
  return value
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => sentence.length > 40)
    .slice(0, 3);
}

export function SummarizerTool() {
  const [text, setText] = useState("");
  const bullets = useMemo(() => summarize(text), [text]);

  return (
    <div className="grid gap-5 rounded-md border border-[var(--line)] bg-[var(--bg-elevated)] p-5 shadow-sm lg:grid-cols-[1.1fr_0.9fr]">
      <label className="grid gap-3">
        <span className="text-sm font-semibold text-[var(--ink)]">Article text</span>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          className="min-h-72 resize-y rounded-md border border-[var(--line)] bg-[var(--bg)] p-4 text-sm leading-6 outline-none ring-signal/20 focus:ring-4"
          placeholder="Paste an article or briefing here..."
        />
      </label>
      <div className="rounded-md bg-[var(--bg)] p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
          <ClipboardList size={18} />
          Summary
        </div>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--ink-soft)]">
          {(bullets.length ? bullets : ["Paste at least a few paragraphs to generate a local summary."]).map(
            (bullet) => (
              <li key={bullet} className="border-l-2 border-signal/40 pl-3">
                {bullet}
              </li>
            )
          )}
        </ul>
      </div>
    </div>
  );
}

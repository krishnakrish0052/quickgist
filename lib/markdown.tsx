import type { ReactNode } from "react";

function renderInline(text: string): ReactNode {
  return text;
}

export function MarkdownArticle({ markdown }: { markdown: string }) {
  const lines = markdown.split("\n");
  const nodes: ReactNode[] = [];
  let listItems: string[] = [];

  function flushList(index: number) {
    if (!listItems.length) return;
    nodes.push(
      <ul key={`ul-${index}`} className="my-5 space-y-2 border-l-2 border-signal/40 pl-5">
        {listItems.map((item) => (
          <li key={item}>{renderInline(item)}</li>
        ))}
      </ul>
    );
    listItems = [];
  }

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList(index);
      return;
    }

    if (trimmed.startsWith("## ")) {
      flushList(index);
      nodes.push(
        <h2 key={index} className="mt-9 text-2xl font-semibold tracking-normal text-ink">
          {trimmed.replace(/^##\s+/, "")}
        </h2>
      );
      return;
    }

    if (trimmed.startsWith("- ")) {
      listItems.push(trimmed.replace(/^-\s+/, ""));
      return;
    }

    flushList(index);
    nodes.push(
      <p key={index} className="mt-4 leading-8 text-ink/80">
        {renderInline(trimmed)}
      </p>
    );
  });

  flushList(lines.length + 1);
  return <div>{nodes}</div>;
}

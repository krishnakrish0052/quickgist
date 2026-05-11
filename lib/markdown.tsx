import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

const components: Components = {
  h2: ({ children, ...props }) => (
    <h2 className="mt-9 mb-3 text-2xl font-semibold tracking-normal text-[var(--ink)]" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="mt-6 mb-2 text-xl font-semibold tracking-normal text-[var(--ink)]" {...props}>
      {children}
    </h3>
  ),
  p: ({ children, ...props }) => (
    <p className="mt-4 leading-8 text-[var(--ink-soft)]" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }) => (
    <ul className="my-5 space-y-2 border-l-2 border-[var(--signal)]/40 pl-5" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="my-5 space-y-2 list-decimal pl-5 text-[var(--ink-soft)]" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="leading-6 text-[var(--ink-soft)]" {...props}>
      {children}
    </li>
  ),
  strong: ({ children, ...props }) => (
    <strong className="font-bold text-[var(--ink)]" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }) => (
    <em className="italic text-[var(--ink-soft)]" {...props}>
      {children}
    </em>
  ),
  a: ({ children, href, ...props }) => (
    <a
      href={href}
      className="text-[var(--signal)] underline underline-offset-2 transition hover:text-[var(--signal-deep)]"
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
      {...props}
    >
      {children}
    </a>
  ),
  code: ({ children, ...props }) => (
    <code
      className="rounded-md bg-[var(--bg-raft)] px-1.5 py-0.5 text-sm font-mono text-[var(--ink)]"
      {...props}
    >
      {children}
    </code>
  ),
  pre: ({ children, ...props }) => (
    <pre
      className="my-5 overflow-x-auto rounded-xl bg-[var(--bg-raft)] p-4 text-sm leading-6"
      {...props}
    >
      {children}
    </pre>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="my-5 border-l-4 border-[var(--signal)] pl-4 italic text-[var(--ink-muted)]"
      {...props}
    >
      {children}
    </blockquote>
  ),
  hr: (props) => <hr className="my-8 border-[var(--line)]" {...props} />,
  img: ({ src, alt, ...props }) => (
    <img
      src={src}
      alt={alt ?? ""}
      className="my-6 w-full rounded-xl object-cover"
      loading="lazy"
      {...props}
    />
  ),
};

export function MarkdownArticle({ markdown }: { markdown: string }) {
  return (
    <div className="prose-article">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}

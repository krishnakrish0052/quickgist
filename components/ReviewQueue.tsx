import Link from "next/link";
import type { ReviewTask } from "@/lib/types";

export function ReviewQueue({ tasks }: { tasks: ReviewTask[] }) {
  if (!tasks.length) {
    return (
      <div className="rounded-md border border-[var(--line)] bg-[var(--bg-elevated)] p-5 text-sm text-[var(--ink-soft)]">
        No open review tasks. The queue is clear.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {tasks.map((task) => (
        <div key={task.id} className="rounded-md border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-semibold text-[var(--ink)]">{task.title}</h3>
            <span className="rounded-full bg-alert/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-alert">
              {task.priority}
            </span>
          </div>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">{task.reason}</p>
          <Link href={`/admin#${task.articleId}`} className="mt-3 inline-flex text-sm font-semibold text-signal">
            Review article package
          </Link>
        </div>
      ))}
    </div>
  );
}

"use client";

import { useFormStatus } from "react-dom";
import { CheckCircle, Loader2, Send, Trash2, Upload } from "lucide-react";
import {
  deleteArticleAction,
  evaluateArticleAction,
  publishArticleAction,
  scheduleDistributionAction,
} from "@/app/(admin)/admin/actions";

function EvalButton() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-md border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-2 text-xs font-semibold text-[var(--ink)] transition hover:border-ink disabled:opacity-50"
    >
      {pending ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
      {pending ? "Evaluating…" : "Evaluate"}
    </button>
  );
}

function PublishButton() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-md bg-signal px-3 py-2 text-xs font-semibold text-[var(--ink)] transition hover:bg-alert disabled:opacity-50"
    >
      {pending ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
      {pending ? "Publishing…" : "Publish"}
    </button>
  );
}

function DistributeButton() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-md bg-[var(--bg)] px-3 py-2 text-xs font-semibold text-[var(--ink)] transition hover:bg-[var(--bg-elevated)] disabled:opacity-50"
    >
      {pending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
      {pending ? "Scheduling…" : "Schedule dist."}
    </button>
  );
}

function DeleteButton() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
    >
      {pending ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}

interface ArticleActionsProps {
  articleId: string;
}

export function ArticleActions({ articleId }: ArticleActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <form action={evaluateArticleAction}>
        <input type="hidden" name="articleId" value={articleId} />
        <EvalButton />
      </form>
      <form action={publishArticleAction}>
        <input type="hidden" name="articleId" value={articleId} />
        <PublishButton />
      </form>
      <form action={scheduleDistributionAction}>
        <input type="hidden" name="articleId" value={articleId} />
        <DistributeButton />
      </form>
      <form
        action={deleteArticleAction}
        onSubmit={(e) => {
          if (!window.confirm("Delete this article permanently? This cannot be undone.")) {
            e.preventDefault();
          }
        }}
      >
        <input type="hidden" name="articleId" value={articleId} />
        <DeleteButton />
      </form>
    </div>
  );
}

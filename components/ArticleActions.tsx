"use client";

import { useFormStatus } from "react-dom";
import { CheckCircle, Loader2, Send, Upload } from "lucide-react";
import { evaluateArticleAction, publishArticleAction, scheduleDistributionAction } from "@/app/(admin)/admin/actions";

function EvalButton() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-3 py-2 text-xs font-semibold text-ink transition hover:border-ink disabled:opacity-50"
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
      className="inline-flex items-center gap-1.5 rounded-md bg-signal px-3 py-2 text-xs font-semibold text-white transition hover:bg-alert disabled:opacity-50"
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
      className="inline-flex items-center gap-1.5 rounded-md bg-paper px-3 py-2 text-xs font-semibold text-ink transition hover:bg-white disabled:opacity-50"
    >
      {pending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
      {pending ? "Scheduling…" : "Schedule dist."}
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
    </div>
  );
}

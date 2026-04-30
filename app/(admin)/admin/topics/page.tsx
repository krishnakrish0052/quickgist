import { AdminNav } from "@/components/AdminNav";
import { getTopics } from "@/lib/repositories/platformRepository";

export const dynamic = "force-dynamic";

export default async function AdminTopicsPage() {
  const topics = await getTopics();

  return (
    <main className="container-shell py-10">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-signal">Admin</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-normal text-ink">Topics</h1>
      <AdminNav />
      <div className="grid gap-4">
        {topics.map((topic) => (
          <div key={topic.id} className="rounded-md border border-line bg-white p-5">
            <div className="flex flex-wrap justify-between gap-3">
              <h2 className="text-xl font-semibold text-ink">{topic.title}</h2>
              <span className="rounded-full bg-paper px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-ink/60">
                {topic.status}
              </span>
            </div>
            <p className="mt-2 leading-7 text-ink/70">{topic.summary}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-signal/10 px-3 py-1 text-xs text-signal">trend {topic.trendScore}</span>
              <span className="rounded-full bg-alert/10 px-3 py-1 text-xs text-alert">{topic.risk} risk</span>
              {topic.keywords.map((keyword) => (
                <span key={keyword} className="rounded-full bg-paper px-3 py-1 text-xs text-ink/65">
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

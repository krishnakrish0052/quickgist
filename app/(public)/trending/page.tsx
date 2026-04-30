import { Activity, Flame, Layers, TrendingUp } from "lucide-react";
import Link from "next/link";
import { getTopics } from "@/lib/repositories/platformRepository";

export const metadata = {
  title: "Trending",
  description: "Live topic clusters with virality, novelty, and source diversity."
};

export const dynamic = "force-dynamic";

export default async function TrendingPage() {
  const topics = [...(await getTopics())].sort((a, b) => b.trendScore - a.trendScore);

  return (
    <>
      <section className="border-b border-line bg-gradient-to-br from-white via-paper to-signal/5">
        <div className="container-wide px-4 py-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-signal/20 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-signal">
            <Flame size={12} />
            Trend intelligence
          </div>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-ink md:text-5xl">
            What the world&apos;s reading right now.
          </h1>
          <p className="mt-3 max-w-2xl text-ink/65">
            Topics are clustered from multiple source feeds, scored by velocity and novelty, and re-evaluated every
            run. The signal-to-noise filter is the same one our editors use.
          </p>
        </div>
      </section>

      <section className="container-wide px-4 py-10">
        {topics.length === 0 ? (
          <p className="text-ink/55">No live topic clusters yet. The pipeline will populate this on next run.</p>
        ) : (
          <div className="grid gap-4">
            {topics.map((topic) => (
              <article
                key={topic.id}
                className="story-card grid gap-4 rounded-2xl border border-line bg-white p-6 md:grid-cols-[1fr_220px]"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em]">
                    <span className="rounded-full bg-signal/10 px-3 py-1 text-signal">{topic.category}</span>
                    <span className="rounded-full bg-paper px-3 py-1 text-ink/65">{topic.risk} risk</span>
                    <span className="rounded-full bg-paper px-3 py-1 text-ink/65">{topic.status}</span>
                  </div>
                  <h2 className="mt-3 font-display text-2xl font-bold text-ink">{topic.title}</h2>
                  <p className="mt-2 max-w-3xl text-ink/70">{topic.summary}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {topic.keywords.slice(0, 6).map((keyword) => (
                      <span key={keyword} className="rounded-full bg-paper px-3 py-1 text-xs text-ink/65">
                        #{keyword}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="grid content-start gap-3 rounded-xl bg-paper p-4">
                  <ScoreRow Icon={TrendingUp} label="Trend score" value={topic.trendScore.toFixed(0)} />
                  <ScoreRow Icon={Activity} label="Novelty" value={(topic.noveltyScore * 100).toFixed(0)} suffix="%" />
                  <ScoreRow Icon={Layers} label="Sources" value={String(topic.sourceIds.length)} />
                  <Link
                    href={`/news/${topic.slug}`}
                    className="mt-2 inline-flex items-center justify-center gap-2 rounded-md bg-ink px-3 py-2 text-xs font-semibold text-paper transition hover:bg-signal"
                  >
                    Read coverage
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function ScoreRow({
  Icon,
  label,
  value,
  suffix
}: {
  Icon: React.ComponentType<any>;
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="inline-flex items-center gap-2 text-xs text-ink/60">
        <Icon size={12} />
        {label}
      </span>
      <span className="font-display text-base font-bold text-ink">
        {value}
        {suffix}
      </span>
    </div>
  );
}

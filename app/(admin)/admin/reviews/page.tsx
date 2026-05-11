import { AdminNav } from "@/components/AdminNav";
import { ReviewQueue } from "@/components/ReviewQueue";
import { getPlatformSnapshot } from "@/lib/repositories/platformRepository";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const { reviewTasks } = await getPlatformSnapshot();

  return (
    <main className="container-shell py-10">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-signal">Admin</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-normal text-[var(--ink)]">Review queue</h1>
      <AdminNav />
      <div className="max-h-[70vh] overflow-y-auto rounded-xl border border-[var(--line)] bg-[var(--bg)]/50 pr-1">
        <div className="p-2">
          <ReviewQueue tasks={reviewTasks.filter((task) => task.status === "open")} />
        </div>
      </div>
    </main>
  );
}

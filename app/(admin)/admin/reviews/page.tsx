import { AdminNav } from "@/components/AdminNav";
import { ReviewQueue } from "@/components/ReviewQueue";
import { getPlatformSnapshot } from "@/lib/repositories/platformRepository";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const { reviewTasks } = await getPlatformSnapshot();

  return (
    <main className="container-shell py-10">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-signal">Admin</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-normal text-ink">Review queue</h1>
      <AdminNav />
      <ReviewQueue tasks={reviewTasks.filter((task) => task.status === "open")} />
    </main>
  );
}

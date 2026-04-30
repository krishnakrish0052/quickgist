import { AdminNav } from "@/components/AdminNav";
import { getPlatformSnapshot } from "@/lib/repositories/platformRepository";

export const dynamic = "force-dynamic";

export default async function AdminSubscribersPage() {
  const { subscribers } = await getPlatformSnapshot();

  return (
    <main className="container-shell py-10">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-signal">Admin</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-normal text-ink">Subscribers</h1>
      <AdminNav />
      <div className="rounded-md border border-line bg-white">
        {subscribers.map((subscriber) => (
          <div key={subscriber.id} className="border-b border-line p-4 last:border-b-0">
            <p className="font-semibold text-ink">{subscriber.email}</p>
            <p className="mt-1 text-sm text-ink/65">{subscriber.status} - {subscriber.topics.join(", ")}</p>
          </div>
        ))}
        {!subscribers.length ? <p className="p-5 text-sm text-ink/65">No subscribers yet.</p> : null}
      </div>
    </main>
  );
}

"use server";

import { revalidatePath } from "next/cache";
import { subscribe } from "@/lib/services/audience";

export async function subscribeAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const topic = String(formData.get("topic") ?? "top-stories").trim();
  if (!email || !email.includes("@")) return;
  await subscribe(email, [topic]);
  revalidatePath("/newsletter");
  revalidatePath("/admin/subscribers");
}

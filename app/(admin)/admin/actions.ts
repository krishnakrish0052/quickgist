"use server";

import { revalidatePath } from "next/cache";
import { runContentPipeline } from "@/workers/pipeline";
import { evaluateQuality } from "@/lib/services/quality";
import { publishArticle } from "@/lib/services/publishing";
import { scheduleDistribution } from "@/lib/services/distribution";
import { getArticleById, seedRepository } from "@/lib/repositories/platformRepository";

export async function runPipelineAction(formData: FormData) {
  await runContentPipeline({
    dryRun: formData.get("dryRun") === "on",
    autoPublish: formData.get("autoPublish") === "on"
  });
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function seedDatabaseAction() {
  await seedRepository();
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function evaluateArticleAction(formData: FormData) {
  const articleId = String(formData.get("articleId") ?? "");
  const article = await getArticleById(articleId);
  if (article) await evaluateQuality(article);
  revalidatePath("/admin");
}

export async function publishArticleAction(formData: FormData) {
  const articleId = String(formData.get("articleId") ?? "");
  await publishArticle(articleId, "admin");
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function scheduleDistributionAction(formData: FormData) {
  const articleId = String(formData.get("articleId") ?? "");
  const article = await getArticleById(articleId);
  if (article) {
    await scheduleDistribution({
      article,
      dryRun: true
    });
  }
  revalidatePath("/admin");
}

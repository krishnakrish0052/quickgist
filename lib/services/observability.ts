import { getPlatformSnapshot } from "@/lib/repositories/platformRepository";

export async function getOperationsSnapshot() {
  const state = await getPlatformSnapshot();
  return {
    sources: state.sources.length,
    rawItems: state.rawItems.length,
    topics: state.topics.length,
    articles: state.articles.length,
    publishedArticles: state.articles.filter((article) => article.status === "published").length,
    openReviewTasks: state.reviewTasks.filter((task) => task.status === "open").length,
    failedQualityReports: state.qualityReports.filter((report) => !report.passed).length,
    distributionJobs: state.distributionJobs.length,
    dryRunJobs: state.distributionJobs.filter((job) => job.status === "dry_run").length,
    auditEvents: state.auditLogs.length
  };
}

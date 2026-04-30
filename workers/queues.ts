import { Queue, type JobsOptions } from "bullmq";
import IORedis from "ioredis";
import { config } from "@/lib/config";

export const queueNames = {
  ingest: "quickgist.ingest",
  cluster: "quickgist.cluster",
  generate: "quickgist.generate",
  quality: "quickgist.quality",
  publish: "quickgist.publish",
  distribution: "quickgist.distribution"
} as const;

export type QueueName = (typeof queueNames)[keyof typeof queueNames];

const globalForQueues = globalThis as unknown as {
  quickgistRedis?: IORedis;
  quickgistQueues?: Record<string, Queue>;
};

export function isQueueEnabled(): boolean {
  return config.queueDriver === "bullmq" && Boolean(config.redisUrl);
}

export function getRedisConnection(): IORedis {
  if (!isQueueEnabled()) {
    throw new Error("Redis is not configured. Set REDIS_URL or use QUEUE_DRIVER=inline.");
  }
  if (!globalForQueues.quickgistRedis) {
    globalForQueues.quickgistRedis = new IORedis(config.redisUrl!, {
      maxRetriesPerRequest: null
    });
  }
  return globalForQueues.quickgistRedis;
}

export function getQueue(name: QueueName): Queue {
  if (!globalForQueues.quickgistQueues) globalForQueues.quickgistQueues = {};
  if (!globalForQueues.quickgistQueues[name]) {
    globalForQueues.quickgistQueues[name] = new Queue(name, {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 250
      }
    });
  }
  return globalForQueues.quickgistQueues[name];
}

export async function enqueue(name: QueueName, data: Record<string, unknown>, options?: JobsOptions) {
  if (!isQueueEnabled()) {
    return { enqueued: false, mode: "inline" as const, name, data };
  }
  return getQueue(name).add(name, data, options);
}

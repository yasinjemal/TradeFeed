import "server-only";

import { after } from "next/server";

import {
  deliverBetterStackHeartbeat,
  type CronHeartbeatStatus,
} from "@/lib/monitoring/better-stack-heartbeat-core";

export type CronJobName =
  | "data-retention"
  | "domain-health"
  | "ranking-computation"
  | "seller-sequences"
  | "subscription-expiry";

const HEARTBEAT_ENV_BY_JOB: Record<CronJobName, string> = {
  "data-retention": "BETTER_STACK_HEARTBEAT_DATA_RETENTION_URL",
  "domain-health": "BETTER_STACK_HEARTBEAT_DOMAIN_HEALTH_URL",
  "ranking-computation": "BETTER_STACK_HEARTBEAT_RANKING_COMPUTATION_URL",
  "seller-sequences": "BETTER_STACK_HEARTBEAT_SELLER_SEQUENCES_URL",
  "subscription-expiry": "BETTER_STACK_HEARTBEAT_SUBSCRIPTION_EXPIRY_URL",
};

async function sendCronHeartbeat(
  job: CronJobName,
  heartbeatUrl: string,
  status: CronHeartbeatStatus,
): Promise<void> {
  const result = await deliverBetterStackHeartbeat(heartbeatUrl, status);
  if (result.outcome === "sent") return;

  // Never log heartbeatUrl or the underlying fetch error: both can contain
  // the secret token Better Stack uses to authenticate a heartbeat.
  console.warn("[cron-heartbeat] Delivery did not complete", {
    job,
    heartbeatStatus: status,
    outcome: result.outcome,
    ...(result.outcome === "http-error"
      ? { statusCode: result.statusCode }
      : {}),
  });
}

/**
 * Queue a heartbeat after the route response. Missing credentials disable the
 * integration, and scheduling/delivery failures never change the cron result.
 */
export function queueCronHeartbeat(
  job: CronJobName,
  status: CronHeartbeatStatus,
): void {
  const heartbeatUrl = process.env[HEARTBEAT_ENV_BY_JOB[job]];
  if (!heartbeatUrl) return;

  const send = () => sendCronHeartbeat(job, heartbeatUrl, status);

  try {
    after(send);
  } catch {
    // `after` should be available in a Next.js request scope. Keep a best-
    // effort fallback so an instrumentation problem cannot fail the cron.
    void send();
  }
}

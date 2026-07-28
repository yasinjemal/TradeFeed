export type CronHeartbeatStatus = "success" | "failure";

export type HeartbeatDeliveryResult =
  | { outcome: "sent" }
  | { outcome: "invalid-url" }
  | { outcome: "http-error"; statusCode: number }
  | { outcome: "network-error" }
  | { outcome: "timeout" };

type HeartbeatFetch = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Pick<Response, "ok" | "status">>;

interface DeliverHeartbeatOptions {
  fetchImpl?: HeartbeatFetch;
  timeoutMs?: number;
}

export const BETTER_STACK_HEARTBEAT_TIMEOUT_MS = 1_500;

const BETTER_STACK_HEARTBEAT_ORIGIN = "https://uptime.betterstack.com";
const HEARTBEAT_PATH_PATTERN = /^\/api\/v1\/heartbeat\/[^/]+$/;

/**
 * Accept only the secret heartbeat URLs issued by Better Stack. Besides
 * catching copy/paste mistakes, the allowlist prevents a compromised
 * environment variable from turning this server-side fetch into an SSRF.
 */
function buildHeartbeatUrl(
  rawUrl: string,
  status: CronHeartbeatStatus,
): URL | null {
  try {
    const url = new URL(rawUrl);
    const pathname = url.pathname.replace(/\/+$/, "");

    if (
      url.origin !== BETTER_STACK_HEARTBEAT_ORIGIN ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      !HEARTBEAT_PATH_PATTERN.test(pathname)
    ) {
      return null;
    }

    url.pathname = status === "failure" ? `${pathname}/fail` : pathname;
    return url;
  } catch {
    return null;
  }
}

/**
 * Deliver a Better Stack heartbeat without ever exposing the secret URL in
 * the result or throwing into the business job. Callers may safely log the
 * returned outcome.
 */
export async function deliverBetterStackHeartbeat(
  rawUrl: string,
  status: CronHeartbeatStatus,
  options: DeliverHeartbeatOptions = {},
): Promise<HeartbeatDeliveryResult> {
  const target = buildHeartbeatUrl(rawUrl, status);
  if (!target) {
    return { outcome: "invalid-url" };
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const requestedTimeout = options.timeoutMs ?? BETTER_STACK_HEARTBEAT_TIMEOUT_MS;
  const timeoutMs =
    Number.isFinite(requestedTimeout) && requestedTimeout > 0
      ? requestedTimeout
      : BETTER_STACK_HEARTBEAT_TIMEOUT_MS;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(target, {
      method: "GET",
      cache: "no-store",
      redirect: "error",
      signal: controller.signal,
    });

    if (!response.ok) {
      return { outcome: "http-error", statusCode: response.status };
    }

    return { outcome: "sent" };
  } catch {
    return controller.signal.aborted
      ? { outcome: "timeout" }
      : { outcome: "network-error" };
  } finally {
    clearTimeout(timeout);
  }
}

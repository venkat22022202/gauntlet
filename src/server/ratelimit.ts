/**
 * GAUNTLET — rate limiting (Upstash Redis, sliding window).
 *
 * Graceful by design: if Upstash isn't configured (no env), every check passes
 * — local dev and self-hosters aren't blocked. In production with Upstash set,
 * the server-keyed endpoints (demo scan, game, AI suggestions) are protected
 * from abuse and runaway cost.
 */

import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let _redis: Redis | null | undefined;
function getRedis(): Redis | null {
  if (_redis !== undefined) return _redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  _redis = url && token ? new Redis({ url, token }) : null;
  return _redis;
}

const _limiters = new Map<string, Ratelimit>();
function getLimiter(bucket: string, max: number, window: Duration): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;
  const key = `${bucket}:${max}:${window}`;
  let rl = _limiters.get(key);
  if (!rl) {
    rl = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(max, window),
      prefix: `gntlt:rl:${bucket}`,
      analytics: false,
    });
    _limiters.set(key, rl);
  }
  return rl;
}

export interface RateResult {
  /** true when the request is allowed */
  ok: boolean;
  /** convenience inverse of ok */
  limited: boolean;
  remaining: number;
  /** epoch ms when the window resets */
  resetMs: number;
}

/**
 * Check (and consume) a token for `identifier` in `bucket`.
 * No-ops to `ok` when Upstash isn't configured.
 */
export async function rateLimit(
  bucket: string,
  identifier: string,
  max: number,
  window: Duration
): Promise<RateResult> {
  const rl = getLimiter(bucket, max, window);
  if (!rl) return { ok: true, limited: false, remaining: max, resetMs: 0 };
  const res = await rl.limit(identifier);
  return { ok: res.success, limited: !res.success, remaining: res.remaining, resetMs: res.reset };
}

/** Best-effort client IP from proxy headers. */
export function clientIp(req: Request): string {
  const h = req.headers;
  const fwd = h.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || h.get("x-real-ip") || "anon";
}

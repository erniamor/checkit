export interface RateLimiter {
	/** Counts one use for `key`; false when its limit is already reached. */
	take(key: string): boolean;
}

interface RateLimiterOptions {
	/** Uses allowed per key within the window. */
	limit: number;
	windowMs: number;
	now?: () => number;
}

/**
 * At most `limit` uses per key within any `windowMs`. In memory: it only
 * counts the uses reaching this process (the API runs one instance).
 */
export function createRateLimiter({
	limit,
	windowMs,
	now = Date.now,
}: RateLimiterOptions): RateLimiter {
	const uses = new Map<string, number[]>();
	return {
		take(key) {
			const time = now();
			const recent = (uses.get(key) ?? []).filter(
				(used) => used > time - windowMs,
			);
			if (recent.length >= limit) {
				uses.set(key, recent);
				return false;
			}
			uses.set(key, [...recent, time]);
			return true;
		},
	};
}

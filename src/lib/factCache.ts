
export const FACT_CACHE_TTL_MS = 30_000;

export type CachedFact = {
  movie: string;
  fact: string;
  createdAt: string;
  cachedAt: number;
};

export function getCachedFact(
  cache: CachedFact | null,
  movie: string,
  now = Date.now()
): CachedFact | null {
  if (!cache) {
    return null;
  }

  if (cache.movie !== movie) {
    return null;
  }

  if (now - cache.cachedAt >= FACT_CACHE_TTL_MS) {
    return null;
  }

  return cache;
}

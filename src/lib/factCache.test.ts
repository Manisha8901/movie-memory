
import { describe, expect, it } from "vitest";
import {
  FACT_CACHE_TTL_MS,
  getCachedFact,
  type CachedFact,
} from "./factCache";

describe("getCachedFact", () => {
  const cache: CachedFact = {
    movie: "RRR",
    fact: "RRR is an Indian Telugu-language film.",
    createdAt: "2026-01-01T00:00:00.000Z",
    cachedAt: 1000,
  };

  it("returns null when the cache is empty", () => {
    expect(getCachedFact(null, "RRR", 2000)).toBeNull();
  });

  it("reuses a fact within 30 seconds", () => {
    expect(getCachedFact(cache, "RRR", 2000)).toEqual(cache);
  });

  it("reuses a fact just before the expiry boundary", () => {
    expect(
      getCachedFact(cache, "RRR", 1000 + FACT_CACHE_TTL_MS - 1)
    ).toEqual(cache);
  });

  it("expires the cache at exactly 30 seconds", () => {
    expect(
      getCachedFact(cache, "RRR", 1000 + FACT_CACHE_TTL_MS)
    ).toBeNull();
  });

  it("invalidates the cache when the movie changes", () => {
    expect(getCachedFact(cache, "Interstellar", 2000)).toBeNull();
  });
});

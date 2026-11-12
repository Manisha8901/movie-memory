
"use client";
// The dashboard owns this ref so cached facts survive FactCard remounts.
// Cache writes happen inside an event/effect callback, not during rendering.
/* eslint-disable react-hooks/immutability */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

import {
  getMovieFact,
  type MovieFactResponse,
} from "../../src/lib/api";

import {
  getCachedFact,
  type CachedFact,
} from "../../src/lib/factCache";

type FactCardProps = {
  movie: string;
  sharedCache?: RefObject<CachedFact | null>;
};

export default function FactCard({
  movie,
  sharedCache,
}: FactCardProps) {
  const [fact, setFact] = useState<MovieFactResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The standalone component also works without a parent cache.
  const localCache = useRef<CachedFact | null>(null);

  // Prefer the dashboard's cache when one is provided.
  const cache = sharedCache ?? localCache;

  const requestInProgress = useRef(false);

  const loadFact = useCallback(
    async (forceRefresh = false) => {
      // Ordinary requests reuse a valid fact within 30 seconds.
      if (!forceRefresh) {
        const cached = getCachedFact(cache.current, movie);

        if (cached) {
          setFact({
            movie: cached.movie,
            fact: cached.fact,
            createdAt: cached.createdAt,
          });

          setError(null);
          return;
        }
      }

      // Prevent duplicate requests.
      if (requestInProgress.current) return;

      requestInProgress.current = true;
      setLoading(true);
      setError(null);

      try {
        const result = await getMovieFact();

        if (result.movie !== movie) {
          throw new Error(
            "The movie changed. Please try again."
          );
        }

        // Store the successful result with its timestamp.
        cache.current = {
          movie: result.movie,
          fact: result.fact,
          createdAt: result.createdAt,
          cachedAt: Date.now(),
        };

        setFact(result);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Unable to load movie fact.";

        // Preserve the last displayed fact if refresh fails.
        if (cache.current?.movie === movie) {
          setError(`${message} Showing your previous fact.`);
        } else {
          setError(message);
        }
      } finally {
        requestInProgress.current = false;
        setLoading(false);
      }
    },
    [movie, cache]
  );

  // Load on mount, using the cache if one is valid.
useEffect(() => {
  // Initial fact loading is an intentional side effect.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  void loadFact(false);
}, [loadFact]);

  return (
    <section className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-2xl">
          ✨
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Movie Fun Fact
          </h2>

          <p className="text-sm text-slate-500">
            Discover something new about your movie
          </p>
        </div>
      </div>

      {loading && (
        <p
          className="mb-4 text-sm text-slate-500"
          role="status"
        >
          Finding an interesting movie fact...
        </p>
      )}

      {error && (
        <p
          className="mb-4 text-sm text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}

      {!loading && fact && (
        <p className="mb-4 leading-7 text-slate-700">
          {fact.fact}
        </p>
      )}

      {!loading && !fact && !error && (
        <p className="mb-4 text-sm text-slate-500">
          No movie fact available yet.
        </p>
      )}

      <div className="mt-auto pt-4">
        <button
          type="button"
          disabled={loading}
          onClick={() => void loadFact(true)}
          className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate New Fact"}
        </button>
      </div>
    </section>
  );
}


"use client";

import { useRef, useState } from "react";
import { updateFavoriteMovie } from "../../src/lib/api";
import type { CachedFact } from "../../src/lib/factCache";
import FactCard from "./FactCard";

type DashboardClientProps = {
  initialMovie: string;
};

export default function DashboardClient({
  initialMovie,
}: DashboardClientProps) {
  const [movie, setMovie] = useState(initialMovie);
  const [draft, setDraft] = useState(initialMovie);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Store the last fact at the dashboard level.
  // It survives FactCard remounts but not a full page reload.
  const factCache = useRef<CachedFact | null>(null);

  function handleCancel() {
    setDraft(movie);
    setEditing(false);
    setError(null);
  }

  async function handleSave() {
    if (saving) return;

    const newMovie = draft.trim();

    if (newMovie.length < 2 || newMovie.length > 100) {
      setError("Movie title must be between 2 and 100 characters.");
      return;
    }

    if (newMovie === movie) {
      setEditing(false);
      setError(null);
      return;
    }

    const previousMovie = movie;

    // A changed movie must not reuse the old movie's fact.
    factCache.current = null;

    // Optimistic update.
    setMovie(newMovie);
    setEditing(false);
    setSaving(true);
    setError(null);

    try {
      const result = await updateFavoriteMovie(newMovie);

      setMovie(result.movie);
      setDraft(result.movie);
    } catch (err) {
      // Restore the previous movie if saving fails.
      setMovie(previousMovie);
      setDraft(previousMovie);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save your movie."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
      {/* Favorite Movie card */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-2xl">
            🎞️
          </div>

          <div>
            <h3 className="text-xl font-bold text-slate-900">
              Favorite Movie
            </h3>
            <p className="text-sm text-slate-500">
              Your all-time favorite film
            </p>
          </div>
        </div>

        {editing ? (
          <div className="space-y-4">
            <label
              htmlFor="favorite-movie"
              className="block text-sm font-medium text-slate-600"
            >
              Movie title
            </label>

            <input
              id="favorite-movie"
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={100}
              disabled={saving}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              aria-label="Favorite movie title"
            />

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving}
                className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
              >
                Save
              </button>

              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-slate-50 p-5">
            <p className="mb-2 text-sm text-slate-500">
              Your all-time favorite movie
            </p>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="break-words text-2xl font-bold text-slate-900">
                {movie}
              </p>

              <button
                type="button"
                onClick={() => {
                  setDraft(movie);
                  setEditing(true);
                  setError(null);
                }}
                disabled={saving}
                className="rounded-lg border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50 disabled:opacity-50"
              >
                Edit
              </button>
            </div>
          </div>
        )}

        {saving && (
          <p role="status" className="mt-4 text-sm text-indigo-700">
            Saving your changes...
          </p>
        )}

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mt-6 border-t border-slate-100 pt-5">
          <p className="text-sm text-slate-500">
            You can update your favorite movie anytime. Your changes
            are saved to your account.
          </p>
        </div>
      </section>

      {/* Movie Fun Fact card */}
      <div className="min-w-0 h-full">
        {!saving ? (
          <FactCard
            key={movie}
            movie={movie}
            sharedCache={factCache}
          />
        ) : (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p role="status" className="text-sm text-slate-600">
              Updating your movie facts...
            </p>
          </section>
        )}
      </div>
    </div>
  );
}

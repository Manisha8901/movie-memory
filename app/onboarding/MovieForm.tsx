
"use client";

import { useActionState } from "react";
import {
  saveFavoriteMovie,
  type MovieFormState,
} from "./actions";

const initialState: MovieFormState = {
  error: null,
};

export default function MovieForm() {
  const [state, formAction, isPending] = useActionState(
    saveFavoriteMovie,
    initialState
  );

  return (
    <form action={formAction} className="space-y-4">
      <input
        type="text"
        name="movie"
        placeholder="Enter your favorite movie"
        minLength={2}
        maxLength={100}
        required
        disabled={isPending}
        className="w-full rounded-lg border border-gray-300 p-3 text-slate-900"
      />

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-blue-600 p-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? "Saving..." : "Save My Favorite Movie"}
      </button>
    </form>
  );
}

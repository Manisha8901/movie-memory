
"use server";

import { auth } from "../../auth";
import { prisma } from "../../src/lib/prisma";
import { redirect } from "next/navigation";

export type MovieFormState = {
  error: string | null;
};

export async function saveFavoriteMovie(
  _previousState: MovieFormState,
  formData: FormData
): Promise<MovieFormState> {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/");
  }

  const value = formData.get("movie");

  if (typeof value !== "string") {
    return { error: "Please enter a movie title." };
  }

  const movie = value.trim();

  if (movie.length < 2 || movie.length > 100) {
    return {
      error: "Movie title must be between 2 and 100 characters.",
    };
  }

  try {
    await prisma.user.update({
      where: { email: session.user.email },
      data: { favoriteMovie: movie },
    });
  } catch {
    return {
      error: "Unable to save your movie. Please try again.",
    };
  }

  redirect("/dashboard");
}

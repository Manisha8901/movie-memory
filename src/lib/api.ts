
export type MovieFactResponse = {
  fact: string;
  movie: string;
  createdAt: string;
};

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function getMovieFact(): Promise<MovieFactResponse> {
  const response = await fetch("/api/fact", {
    cache: "no-store",
  });

  const data: unknown = await response.json();

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof data.error === "string"
        ? data.error
        : "Unable to load movie fact.";

    throw new ApiError(response.status, message);
  }

  if (
    typeof data !== "object" ||
    data === null ||
    !("fact" in data) ||
    typeof data.fact !== "string" ||
    !("movie" in data) ||
    typeof data.movie !== "string" ||
    !("createdAt" in data) ||
    typeof data.createdAt !== "string"
  ) {
    throw new ApiError(500, "Invalid fact response from server.");
  }

  return {
    fact: data.fact,
    movie: data.movie,
    createdAt: data.createdAt,
  };
}

export type UpdateMovieResponse = {
  movie: string;
};

export async function updateFavoriteMovie(
  movie: string
): Promise<UpdateMovieResponse> {
  const response = await fetch("/api/me/movie", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ movie }),
  });

  const data: unknown = await response.json();

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof data.error === "string"
        ? data.error
        : "Unable to update your movie.";

    throw new ApiError(response.status, message);
  }

  if (
    typeof data !== "object" ||
    data === null ||
    !("movie" in data) ||
    typeof data.movie !== "string"
  ) {
    throw new ApiError(500, "Invalid movie response from server.");
  }

  return { movie: data.movie };
}

export type UserProfileResponse = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  favoriteMovie: string | null;
};

export async function getCurrentUser(): Promise<UserProfileResponse> {
  const response = await fetch("/api/me", {
    cache: "no-store",
  });

  const data: unknown = await response.json();

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof data.error === "string"
        ? data.error
        : "Unable to load your profile.";

    throw new ApiError(response.status, message);
  }

  if (
    typeof data !== "object" ||
    data === null ||
    !("id" in data) ||
    typeof data.id !== "string" ||
    !("favoriteMovie" in data) ||
    !(
      typeof data.favoriteMovie === "string" ||
      data.favoriteMovie === null
    )
  ) {
    throw new ApiError(500, "Invalid user profile response.");
  }

  return data as UserProfileResponse;
}

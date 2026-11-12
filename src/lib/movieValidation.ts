
export function validateMovieTitle(value: string): string | null {
  const movie = value.trim();

  if (movie.length < 2) {
    return "Movie title must have at least 2 characters.";
  }

  if (movie.length > 100) {
    return "Movie title must have at most 100 characters.";
  }

  return null;
}

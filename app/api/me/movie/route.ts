
import { validateMovieTitle } from "../../../../src/lib/movieValidation";
import { auth } from "../../../../auth";
import { prisma } from "../../../../src/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(request: Request) {
  // Only authenticated users can update a movie
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Please sign in first." },
      { status: 401 }
    );
  }

  // Read and validate the request body
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request." },
      { status: 400 }
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("movie" in body) ||
    typeof body.movie !== "string"
  ) {
    return NextResponse.json(
      { error: "A movie title is required." },
      { status: 400 }
    );
  }

  const movie = body.movie.trim();

 const validationError = validateMovieTitle(movie);

 if (validationError) {
   return NextResponse.json(
     { error: validationError },
     { status: 400 }
   );
 }

  try {
    // Find the current user from the authenticated session
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    // Update only this authenticated user's movie
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { favoriteMovie: movie },
      select: { favoriteMovie: true },
    });

    return NextResponse.json({
      movie: updatedUser.favoriteMovie,
    });
  } catch (error) {
    console.error("Failed to update favorite movie:", error);

    return NextResponse.json(
      { error: "Unable to save your movie. Please try again." },
      { status: 500 }
    );
  }
}

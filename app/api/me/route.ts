
import { auth } from "../../../auth";
import { prisma } from "../../../src/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  // Only signed-in users can access their profile.
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Please sign in first." },
      { status: 401 }
    );
  }

  try {
    // Fetch only the authenticated user's information.
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        favoriteMovie: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        favoriteMovie: user.favoriteMovie,
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      }
    );
  } catch (error) {
    console.error("Failed to fetch user profile:", error);

    return NextResponse.json(
      { error: "Unable to retrieve your profile." },
      { status: 500 }
    );
  }
}


import { auth } from "../../../auth";
import { prisma } from "../../../src/lib/prisma";
import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function GET() {
  // 1. Check authentication
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Please sign in first." },
      { status: 401 }
    );
  }

  try {
    // 2. Fetch the signed-in user's favorite movie
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
      select: {
        id: true,
        favoriteMovie: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    if (!user.favoriteMovie) {
      return NextResponse.json(
        { error: "Please add your favorite movie first." },
        { status: 400 }
      );
    }

    // 3. Generate a movie fact using OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 15000,
      maxRetries: 0,
    });

    const response = await openai.responses.create({
      model: "gpt-5.4-mini",
       instructions:
         "Provide one short, interesting and accurate movie fact. " +
         "Do not invent facts. If the movie title is ambiguous, " +
         "acknowledge the uncertainty. " +
         "Return plain text only. Do not use Markdown, asterisks, " +
         "headings, bullet points, or other formatting.",

      input:
        `Give one interesting fun fact about the movie ` +
        `"${user.favoriteMovie}". Keep it under 2 sentences.`,
      max_output_tokens: 180,
    });

    const fact = response.output_text?.trim();

    if (!fact) {
      throw new Error("OpenAI returned an empty response");
    }

    // 4. Save the generated fact in PostgreSQL
    const savedFact = await prisma.movieFact.create({
      data: {
        userId: user.id,
        movie: user.favoriteMovie,
        content: fact,
      },
    });

    // 5. Return the result to the frontend
    return NextResponse.json(
      {
        fact: savedFact.content,
        movie: savedFact.movie,
        createdAt: savedFact.createdAt.toISOString(),
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    // Handle OpenAI rate limits separately.
    if (error instanceof OpenAI.RateLimitError) {
      console.warn("OpenAI rate limit reached.");

      return NextResponse.json(
        {
          error:
            "Movie facts are temporarily unavailable due to an API rate limit. Please try again later.",
        },
        {
          status: 429,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    console.error(
      "Movie fact generation failed:",
      error instanceof Error ? error.message : "Unknown error"
    );

    return NextResponse.json(
      {
        error: "Unable to generate a movie fact. Please try again.",
      },
      { status: 500 }
    );
  }
}

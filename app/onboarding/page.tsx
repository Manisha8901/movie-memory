
import { auth } from "../../auth";
import { prisma } from "../../src/lib/prisma";
import { redirect } from "next/navigation";
import MovieForm from "./MovieForm";
export const instant = false;

export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { favoriteMovie: true },
  });

  if (user?.favoriteMovie) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-3 text-center text-3xl font-bold text-slate-900">
          🎬 Welcome to Movie Memory!
        </h1>

        <p className="mb-6 text-center text-slate-600">
          What&apos;s your favorite movie?
        </p>

        <MovieForm />
      </div>
    </main>
  );
}

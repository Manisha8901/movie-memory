
import { auth, signIn } from "../auth";
import { prisma } from "../src/lib/prisma";
import { redirect } from "next/navigation";
export const instant = false;

export default async function Home() {
  const session = await auth();

  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { favoriteMovie: true },
    });

    if (user?.favoriteMovie) {
      redirect("/dashboard");
    }

    redirect("/onboarding");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
        <div className="mb-4 text-5xl">🎬</div>

        <h1 className="mb-3 text-3xl font-bold text-slate-900">
          Movie Memory
        </h1>

        <p className="mb-8 text-slate-600">
          Save your favorite movie and discover fun AI-generated facts!
        </p>

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Sign in with Google
          </button>
        </form>
      </div>
    </main>
  );
}

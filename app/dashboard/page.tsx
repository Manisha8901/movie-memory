
import DashboardClient from "./DashboardClient";
import { auth, signOut } from "../../auth";
import { prisma } from "../../src/lib/prisma";
import { redirect } from "next/navigation";
import Image from "next/image";

export const instant = false;

export default async function DashboardPage() {
  const session = await auth();

  // Only authenticated users can access the dashboard.
  if (!session?.user?.email) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  // New users must complete onboarding.
  if (!user?.favoriteMovie) {
    redirect("/onboarding");
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Top navigation bar */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-2xl text-white">
              🎬
            </div>

            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Movie Memory
              </h1>
              <p className="text-xs text-slate-500">
                Your personal movie space
              </p>
            </div>
          </div>

          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Sign Out
            </button>
          </form>
        </div>
      </header>

      {/* Main dashboard content */}
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        {/* Welcome section */}
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-indigo-600">
            My Dashboard
          </p>

          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Welcome back, {user.name?.split(" ")[0] ?? "Movie lover"}!
          </h2>

          <p className="mt-3 text-slate-600">
            Manage your favorite movie and discover interesting facts.
          </p>
        </div>

        {/* Profile section */}
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            {user.image ? (
              <Image
                src={user.image}
                alt="Profile photo"
                width={64}
                height={64}
                unoptimized
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-700">
                {user.name?.charAt(0).toUpperCase() ?? "M"}
              </div>
            )}

            <div className="min-w-0">
              <p className="font-semibold text-slate-900">
                {user.name ?? "Movie lover"}
              </p>

              <p className="break-all text-sm text-slate-500">
                {user.email ?? "No email available"}
              </p>
            </div>
          </div>
        </section>

        {/* Favorite movie and AI fact sections */}
        <DashboardClient initialMovie={user.favoriteMovie} />

        <footer className="mt-12 border-t border-slate-200 pt-6 text-center text-sm text-slate-400">
          Movie Memory · Built with Next.js, React, and PostgreSQL
        </footer>
      </div>
    </main>
  );
}

import Link from "next/link";
import { login, signup } from "./actions";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    mode?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, message, mode } = await searchParams;
  const isSignup = mode === "signup";

  return (
    <main className="flex flex-1 items-center bg-slate-950 px-4 py-16 text-white">
      <section className="mx-auto w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl shadow-slate-950 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">Draft Analyzer</p>
        <h1 className="mt-3 text-3xl font-bold">{isSignup ? "Create your account" : "Welcome back"}</h1>
        <p className="mt-2 leading-6 text-slate-400">{isSignup ? "Create an account to save drafts and rankings across devices." : "Sign in to access your saved drafts and personalized rankings."}</p>

        <form action={isSignup ? signup : login} className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-slate-200">
              Email address
            </label>
            <input id="email" name="email" type="email" autoComplete="email" required className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20" />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-slate-200">
              Password
            </label>
            <input id="password" name="password" type="password" autoComplete={isSignup ? "new-password" : "current-password"} required className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20" />
          </div>

          {message && (
            <p role="status" className="rounded-lg border border-emerald-900/70 bg-emerald-950/50 px-4 py-3 text-sm text-emerald-300">
              {message}
            </p>
          )}

          {error && (
            <p role="alert" className="rounded-lg border border-red-900/70 bg-red-950/50 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          )}

          <button type="submit" className="w-full cursor-pointer rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-500">
            {isSignup ? "Create account" : "Sign in"}
          </button>
          {isSignup && <p className="text-center text-xs leading-5 text-slate-500">Passwords must contain at least 8 characters.</p>}
        </form>

        <div className="mt-6 border-t border-slate-800 pt-6 text-center">
          <p className="text-sm text-slate-400">
            {isSignup ? "Already have an account?" : "New to Draft Analyzer?"}{" "}
            <Link href={isSignup ? "/login" : "/login?mode=signup"} className="font-semibold text-emerald-400 hover:text-emerald-300">
              {isSignup ? "Sign in" : "Create an account"}
            </Link>
          </p>

          <Link href="/" className="mt-4 inline-block text-sm font-semibold text-sky-400 hover:text-sky-300">
            Return home
          </Link>
        </div>
      </section>
    </main>
  );
}

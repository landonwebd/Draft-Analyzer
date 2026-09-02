import type { Metadata } from "next";
import Link from "next/link";
import { requestPasswordReset } from "./actions";

export const metadata: Metadata = {
  title: "Forgot Password | Draft Analyzer",
  description: "Request a password reset email for your Draft Analyzer account.",
};

type ForgotPasswordPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const { error, message } = await searchParams;
  return (
    <main className="flex flex-1 items-center bg-slate-950 px-4 py-16 text-white">
      <section className="mx-auto w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl shadow-slate-950 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">Draft Analyzer</p>
        <h1 className="mt-3 text-3xl font-bold">Reset your password</h1>
        <p className="mt-2 leading-6 text-slate-400">Enter your email address and we’ll send you a link to choose a new password.</p>
        <form action={requestPasswordReset} className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-slate-200">
              Email address
            </label>
            <input id="email" name="email" type="email" autoComplete="email" required className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20" />
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
            Send reset link
          </button>
        </form>
        <div className="mt-6 border-t border-slate-800 pt-6 text-center">
          <Link href="/login" className="text-sm font-semibold text-sky-400 hover:text-sky-300">
            Return to sign in
          </Link>
        </div>
      </section>
    </main>
  );
}

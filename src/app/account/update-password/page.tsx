import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updatePassword } from "./actions";

export const metadata: Metadata = {
  title: "Choose a New Password | Draft Analyzer",
  description: "Choose a new password for your Draft Analyzer account.",
};

type UpdatePasswordPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function UpdatePasswordPage({ searchParams }: UpdatePasswordPageProps) {
  const supabase = await createClient();
  const { error } = await searchParams;
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/forgot-password?error=Your password reset session is invalid or has expired.");
  }

  return (
    <main className="flex flex-1 items-center bg-slate-950 px-4 py-16 text-white">
      <section className="mx-auto w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl shadow-slate-950 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">Draft Analyzer</p>
        <h1 className="mt-3 text-3xl font-bold">Choose a new password</h1>
        <p className="mt-2 leading-6 text-slate-400">Enter and confirm the new password for your account.</p>
        <form action={updatePassword} className="mt-8 space-y-5">
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-slate-200">
              New password
            </label>
            <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20" />
          </div>
          <div>
            <label htmlFor="passwordConfirmation" className="block text-sm font-semibold text-slate-200">
              Confirm new password
            </label>
            <input id="passwordConfirmation" name="passwordConfirmation" type="password" autoComplete="new-password" minLength={8} required className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20" />
          </div>
          {error && (
            <p role="alert" className="rounded-lg border border-red-900/70 bg-red-950/50 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          )}
          <button type="submit" className="w-full cursor-pointer rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-500">
            Update password
          </button>
          <p className="text-center text-xs leading-5 text-slate-500">Passwords must contain at least 8 characters.</p>
        </form>
      </section>
    </main>
  );
}

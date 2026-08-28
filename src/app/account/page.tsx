import { redirect } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import { createClient } from "@/lib/supabase/server";
import { logout } from "./actions";
import AccountDangerZone from "@/components/AccountDangerZone";

type AccountPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims) {
    redirect("/login");
  }

  return (
    <>
      <SiteHeader />

      <main className="flex flex-1 items-center bg-slate-950 px-4 py-16 text-white">
        <section className="mx-auto w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">Your Account</p>
          <h1 className="mt-3 text-3xl font-bold">You’re signed in</h1>
          <p className="mt-3 text-slate-400">{typeof claims.email === "string" ? claims.email : "Authenticated user"}</p>
          {error && (
            <p role="alert" className="mt-5 rounded-lg border border-red-900/70 bg-red-950/50 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          )}
          <form action={logout} className="mt-8">
            <button type="submit" className="w-full cursor-pointer rounded-lg border border-slate-600 px-5 py-3 font-semibold text-slate-200 hover:border-slate-400 hover:bg-slate-800 hover:text-white">
              Sign out
            </button>
          </form>
          <AccountDangerZone />
        </section>
      </main>
    </>
  );
}

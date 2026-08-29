"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { usePathname } from "next/navigation";

export default function AccountStatus() {
  const [email, setEmail] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    let wasCancelled = false;
    const supabase = createClient();

    async function loadUser() {
      const { data } = await supabase.auth.getClaims();
      const userEmail = data?.claims && typeof data.claims.email === "string" ? data.claims.email : null;

      if (!wasCancelled) {
        setEmail(userEmail);
        setHasLoaded(true);
      }
    }

    void loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null);
      setHasLoaded(true);
    });

    return () => {
      wasCancelled = true;
      subscription.unsubscribe();
    };
  }, [pathname]);

  if (!hasLoaded) {
    return (
      <span aria-label="Loading account status" className="rounded-full border border-slate-700 p-3 text-slate-500">
        <UserRound aria-hidden="true" />
      </span>
    );
  }

  return (
    <div className="flex items-center gap-4">
      {!email && <span className="hidden sm:inline text-emerald-400">Welcome, Guest</span>}
      <Link href={email ? "/account" : "/login"} aria-label={email ? `Account for ${email}` : "Sign in"} className="inline-flex max-w-xs items-center gap-3 rounded-full border border-slate-700 px-4 py-2 text-slate-300 hover:border-slate-500 hover:bg-slate-800 hover:text-white">
        <UserRound aria-hidden="true" />

        <span className="hidden min-w-0 text-sm font-semibold sm:block">
          {email ? (
            <>
              Hello, <span className="inline-block max-w-48 truncate align-bottom text-emerald-400">{email}</span>
            </>
          ) : (
            "Sign in"
          )}
        </span>
      </Link>
    </div>
  );
}

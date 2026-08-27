import RankingsDisplay from "@/components/RankingsDisplay";
import Link from "next/link";
import { MoveLeft } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";

type RankingsPageProps = {
  searchParams: Promise<{
    pool?: string;
  }>;
};

export default async function RankingsPage({ searchParams }: RankingsPageProps) {
  const { pool } = await searchParams;
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-slate-950 px-6 py-24 text-white">
        <div className="mx-auto max-w-7xl">
          <Link href="/" className="mb-6 inline-flex gap-2 text-sky-400 hover:text-sky-300">
            <MoveLeft /> Back to imported drafts
          </Link>
          <h1 className="text-4xl font-bold">Draft Rankings</h1>
          <RankingsDisplay initialPoolSlug={pool ?? null} />
        </div>
      </main>
    </>
  );
}

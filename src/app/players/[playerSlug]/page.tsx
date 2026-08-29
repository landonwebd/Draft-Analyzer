import PlayerAnalysis from "@/components/PlayerAnalysis";

type PlayerPageProps = {
  params: Promise<{
    playerSlug: string;
  }>;
  searchParams: Promise<{
    pool?: string;
  }>;
};

export default async function PlayerPage({ params, searchParams }: PlayerPageProps) {
  const { playerSlug } = await params;
  const { pool } = await searchParams;

  return (
    <main className="bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-7xl">
        <PlayerAnalysis playerSlug={playerSlug} poolSlug={pool ?? "ALL"} />
      </div>
    </main>
  );
}

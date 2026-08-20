import PlayerAnalysis from "@/components/PlayerAnalysis";

type PlayerPageProps = {
  params: Promise<{
    playerSlug: string;
  }>;
  searchParams: Promise<{ fromDraft?: string }>;
};

export default async function PlayerPage({ params, searchParams }: PlayerPageProps) {
  const { playerSlug } = await params;
  const { fromDraft } = await searchParams;

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-24 text-white">
      <div className="mx-auto max-w-7xl">
        <PlayerAnalysis playerSlug={playerSlug} fromDraft={fromDraft} />
      </div>
    </main>
  );
}

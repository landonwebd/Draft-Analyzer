import PlayerAnalysis from "@/components/PlayerAnalysis";

type PlayerPageProps = {
  params: Promise<{
    playerSlug: string;
  }>;
};

export default async function PlayerPage({ params }: PlayerPageProps) {
  const { playerSlug } = await params;

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-24 text-white">
      <div className="mx-auto max-w-7xl">
        <PlayerAnalysis playerSlug={playerSlug} />{" "}
      </div>
    </main>
  );
}

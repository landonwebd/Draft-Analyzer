"use client";

import { useState, type ChangeEvent } from "react";
import type { ImportedDraft } from "@/types/draft";
import { buildPlayerRankings } from "@/utils/buildPlayerRankings";
import { createPlayerKey } from "@/utils/createPlayerKey";
import { createPlayerSlug } from "@/utils/createPlayerSlug";
import StatCard from "@/components/StatCard";
import { getPositionColor } from "@/utils/positionStyles";
import { usePlayerRankingOverrides } from "@/hooks/usePlayerRankingOverrides";
import { useDraftPools } from "@/hooks/useDraftPools";
import { useImportedDrafts } from "@/hooks/useImportedDrafts";
import { createDraftPoolSlug } from "@/utils/createDraftPoolSlug";
import ManualAdpSlider from "@/components/ManualAdpSlider";
import HistoryBackButton from "@/components/HistoryBackButton";
import FilterSelect from "@/components/FilterSelect";
import Link from "next/link";
import { ArrowLeftRight, ClipboardList, ArrowRight, Info, ChartColumn, Target, Users, ShieldCheck } from "lucide-react";

type PlayerAnalysisProps = {
  playerSlug: string;
  poolSlug: string;
};

export default function PlayerAnalysis({ playerSlug, poolSlug }: PlayerAnalysisProps) {
  const [selectedPoolSlug, setSelectedPoolSlug] = useState(poolSlug);
  const { overrides, hasLoadedOverrides, updateOverride } = usePlayerRankingOverrides();
  const { draftPools, hasLoadedDraftPools } = useDraftPools();
  const { importedDrafts: drafts, hasLoadedImportedDrafts: hasLoaded } = useImportedDrafts();
  if (!hasLoaded || !hasLoadedOverrides || !hasLoadedDraftPools) {
    return <p>Loading player analysis...</p>;
  }
  function draftContainsPlayer(draft: ImportedDraft): boolean {
    return draft.picks.some((pick) => {
      const pickPlayerKey = createPlayerKey(pick.playerName, pick.position, pick.nflTeam);
      return createPlayerSlug(pickPlayerKey) === playerSlug;
    });
  }
  const selectedDraftPool = draftPools.find((draftPool) => createDraftPoolSlug(draftPool.name) === selectedPoolSlug);
  const unassignedDrafts = drafts.filter((draft) => draft.poolId === undefined);
  const playerAppearsInUnassigned = unassignedDrafts.some(draftContainsPlayer);
  const playerAppearsInSelectedPool = selectedDraftPool ? drafts.some((draft) => draft.poolId === selectedDraftPool.id && draftContainsPlayer(draft)) : false;
  let activePoolSlug = "all";
  if (selectedPoolSlug === "unassigned" && playerAppearsInUnassigned) {
    activePoolSlug = "unassigned";
  } else if (selectedDraftPool && playerAppearsInSelectedPool) {
    activePoolSlug = createDraftPoolSlug(selectedDraftPool.name);
  }
  const playerPoolOptions = [
    {
      value: "all",
      label: `All Drafts (${drafts.length})`,
    },
    ...(playerAppearsInUnassigned
      ? [
          {
            value: "unassigned",
            label: `Unassigned (${unassignedDrafts.length})`,
          },
        ]
      : []),
    ...draftPools
      .filter((draftPool) => drafts.some((draft) => draft.poolId === draftPool.id && draftContainsPlayer(draft)))
      .map((draftPool) => ({
        value: createDraftPoolSlug(draftPool.name),
        label: `${draftPool.name} (${drafts.filter((draft) => draft.poolId === draftPool.id).length})`,
      })),
  ];
  let poolDrafts = drafts;
  if (activePoolSlug === "unassigned") {
    poolDrafts = drafts.filter((draft) => draft.poolId === undefined);
  } else if (activePoolSlug !== "all" && selectedDraftPool) {
    poolDrafts = drafts.filter((draft) => draft.poolId === selectedDraftPool.id);
  }
  const rankings = buildPlayerRankings(poolDrafts, overrides);
  const player = rankings.find((ranking) => {
    const rankingPlayerKey = createPlayerKey(ranking.playerName, ranking.position, ranking.nflTeam);
    return createPlayerSlug(rankingPlayerKey) === playerSlug;
  });

  if (!player) {
    return <p className="text-red-300">Player not found.</p>;
  }

  const playerKey = createPlayerKey(player.playerName, player.position, player.nflTeam);
  const currentOverride = overrides[playerKey] ?? {
    manualAdpAdjustment: 0,
    isExcluded: false,
  };
  const myDraftAppearances = poolDrafts.flatMap((draft) => {
    const matchingPick = draft.picks.find((pick) => {
      const pickPlayerKey = createPlayerKey(pick.playerName, pick.position, pick.nflTeam);
      const pickPlayerSlug = createPlayerSlug(pickPlayerKey);
      const belongsToMyTeam = pick.fantasyTeam === draft.myFantasyTeam;
      return pickPlayerSlug === playerSlug && belongsToMyTeam;
    });
    if (!matchingPick) {
      return [];
    }
    return [
      {
        draft,
        pick: matchingPick,
      },
    ];
  });
  const adpDifference = player.finalPersonalizedAdp - player.averageOverallPick;
  const adpComparison = Math.abs(adpDifference) < 0.01 ? "Matches overall ADP" : `${Math.abs(adpDifference).toFixed(2)} picks ${adpDifference > 0 ? "later" : "earlier"} than overall ADP`;
  const minimumAdpWasApplied = player.weightedScore + player.manualAdpAdjustment < 1;
  const hasOneOverallDraftPosition = player.earliestOverallPick === player.latestOverallPick;
  const hasOnePersonalDraftPosition = player.myEarliestOverallPick !== null && player.myLatestOverallPick !== null && player.myEarliestOverallPick === player.myLatestOverallPick;
  const overallDraftRange = hasOneOverallDraftPosition ? `${player.earliestOverallPick}` : `${player.earliestOverallPick}–${player.latestOverallPick}`;
  const myDraftRange = player.myEarliestOverallPick === null || player.myLatestOverallPick === null ? "Not drafted" : hasOnePersonalDraftPosition ? `${player.myEarliestOverallPick}` : `${player.myEarliestOverallPick}–${player.myLatestOverallPick}`;

  function handlePlayerPoolChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextPoolSlug = event.target.value;
    setSelectedPoolSlug(nextPoolSlug);
    const nextUrl = nextPoolSlug === "all" ? `/players/${playerSlug}` : `/players/${playerSlug}?pool=${encodeURIComponent(nextPoolSlug)}`;
    window.history.replaceState(null, "", nextUrl);
  }

  return (
    <div>
      <HistoryBackButton fallbackHref="/rankings" label="Back" />
      <header className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 sm:p-8">
        <div className="absolute -top-24 -right-24 size-64 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,2fr)] lg:items-center">
          <div className="flex items-center gap-5">
            <div className={`grid size-16 shrink-0 place-items-center rounded-full border border-white/15 text-xl font-bold text-white shadow-lg ${getPositionColor(player.position)}`}>{player.position}</div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">{player.playerName}</h1>
              <p className="mt-2 text-slate-300">
                {player.isExcluded ? "Excluded from rankings" : `${player.position}${player.positionRank}`}
                <span className="mx-2 text-slate-600">•</span>
                {player.nflTeam}
              </p>
              <div className="mt-5 max-w-sm">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Ranking Pool</p>
                <FilterSelect id="playerRankingPool" label={`Choose a ranking pool for ${player.playerName}`} value={activePoolSlug} options={playerPoolOptions} onChange={handlePlayerPoolChange} />
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Draft Ranges</p>
            <p className="mt-1 text-sm text-slate-400">Earliest and latest overall selections across the active ranking pool.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-700 bg-slate-950/50 p-4">
                <p className="text-sm text-slate-400">Overall Draft Range</p>
                <p className="mt-2 text-2xl font-bold tabular-nums">{overallDraftRange}</p>
                <p className="mt-1 text-xs text-slate-500">{hasOneOverallDraftPosition ? `Only observed at pick ${player.earliestOverallPick}` : `Pick ${player.earliestOverallPick} to pick ${player.latestOverallPick}`}</p>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-950/50 p-4">
                <p className="text-sm text-slate-400">My Draft Range</p>
                <p className="mt-2 text-2xl font-bold tabular-nums">{myDraftRange}</p>
                <p className="mt-1 text-xs text-slate-500">{player.myEarliestOverallPick === null ? "No personal draft selections" : hasOnePersonalDraftPosition ? `Only selected at pick ${player.myEarliestOverallPick}` : `Pick ${player.myEarliestOverallPick} to pick ${player.myLatestOverallPick}`}</p>
              </div>
            </div>
          </div>
        </div>
      </header>
      <section className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(16rem,1fr)]">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <div>
            <h2 className="font-bold">Manual Ranking Override</h2>
            <p className="mt-1 text-sm text-slate-400">Move this player in your rankings.</p>
          </div>
          <ManualAdpSlider
            key={playerKey}
            initialValue={currentOverride.manualAdpAdjustment}
            onCommit={(value) =>
              updateOverride(playerKey, {
                ...currentOverride,
                manualAdpAdjustment: value,
              })
            }
          />
          {minimumAdpWasApplied && (
            <p role="status" className="mt-3 text-sm font-medium text-amber-300">
              Minimum Personalized ADP of 1 applied.
            </p>
          )}
          <div className="mt-6 flex items-center justify-between gap-6 border-t border-slate-800 pt-6">
            <div>
              <h3 className="font-semibold text-slate-200">Exclude from rankings</h3>
              <p className="mt-1 text-sm text-slate-400">Hide this player from rankings, tiers, exports, and Best Available.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={currentOverride.isExcluded}
              aria-label={`Exclude ${player.playerName} from rankings`}
              onClick={() =>
                updateOverride(playerKey, {
                  ...currentOverride,
                  isExcluded: !currentOverride.isExcluded,
                })
              }
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border transition-colors ${currentOverride.isExcluded ? "border-red-500 bg-red-600" : "border-slate-600 bg-slate-700"}`}
            >
              <span aria-hidden="true" className={`size-5 rounded-full bg-white shadow-sm transition-transform ${currentOverride.isExcluded ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
        </div>
        <StatCard label="Ranking Confidence" value={player.rankingConfidenceLabel} description={`${player.rankingConfidence.toFixed(0)}% evidence score · Appeared in ${player.timesDrafted} of ${player.totalDrafts} drafts`} icon={<ShieldCheck size={18} />} />
      </section>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Personalized ADP" value={player.finalPersonalizedAdp.toFixed(2)} description={adpComparison} featured icon={<Target size={18} />} />
        <StatCard label="My Draft Count" value={player.myDraftCount} description={`${(player.myDraftRate * 100).toFixed(1)}% of ${player.totalDrafts} drafts`} icon={<Users size={18} />} />
        <StatCard label="Overall Average Pick" value={player.averageOverallPick.toFixed(2)} description={`Market draft rate: ${(player.draftRate * 100).toFixed(1)}%`} icon={<ChartColumn size={18} />} />
        <StatCard label="Meaningful Passes" value={player.meaningfulPassCount} description={`${player.passOpportunityCount} total pass opportunities`} icon={<ArrowLeftRight size={18} />} />
      </div>
      <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-sky-400/10 text-sky-300">
            <ClipboardList size={20} />
          </span>
          <div>
            <h2 className="text-2xl font-bold">Your Draft History</h2>
            <p className="mt-1 text-sm text-slate-400">
              Drafted {player.playerName} in {myDraftAppearances.length} of {player.totalDrafts} drafts.
            </p>
          </div>
        </div>
        {myDraftAppearances.length === 0 ? (
          <div className="mt-6 grid min-h-48 place-items-center rounded-xl border border-dashed border-slate-700 bg-slate-950/40 p-8 text-center">
            <div>
              <span className="mx-auto grid size-14 place-items-center rounded-full bg-slate-800 text-slate-400">
                <ClipboardList size={26} />
              </span>
              <p className="mt-4 font-semibold text-slate-300">You haven&apos;t drafted {player.playerName}.</p>
              <p className="mt-2 text-sm text-slate-500">Meaningful passes below may help explain why.</p>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {myDraftAppearances.map(({ draft, pick }) => (
              <article key={draft.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
                <h3 className="font-bold">
                  <Link href={`/drafts/${draft.id}`} className="text-sky-300 hover:text-sky-200 hover:underline">
                    {draft.name}
                  </Link>
                </h3>
                <p className="mt-2 text-slate-300">{draft.myFantasyTeam}</p>
                <p className="mt-1 text-sm text-slate-400">
                  Drafted at pick {pick.pick} · Overall {pick.overall}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
      <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-amber-400/10 text-amber-300">
            <ArrowLeftRight size={20} />
          </span>
          <div>
            <h2 className="text-2xl font-bold">Meaningful Passes ({player.meaningfulPasses.length})</h2>
            <p className="mt-1 text-sm text-slate-400">Players you selected while {player.playerName} was still available.</p>
          </div>
        </div>
        {player.meaningfulPasses.length === 0 ? (
          <p className="mt-5 text-slate-400">No meaningful passes were found for this player.</p>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {player.meaningfulPasses.map((meaningfulPass) => {
              const selectedPlayerKey = createPlayerKey(meaningfulPass.selectedPick.playerName, meaningfulPass.selectedPick.position, meaningfulPass.selectedPick.nflTeam);
              const selectedPlayerSlug = createPlayerSlug(selectedPlayerKey);
              const severityLabel = meaningfulPass.passSeverity >= 6 ? "High" : meaningfulPass.passSeverity >= 3 ? "Moderate" : "Low";
              const severityClasses = meaningfulPass.passSeverity >= 6 ? "border-red-500/30 bg-red-500/10 text-red-300" : meaningfulPass.passSeverity >= 3 ? "border-amber-500/30 bg-amber-500/10 text-amber-300" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
              return (
                <article key={`${meaningfulPass.draftId}-${meaningfulPass.selectedPick.overall}`} className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <Link href={`/drafts/${meaningfulPass.draftId}`} className="text-xl font-bold text-sky-300 hover:text-sky-200 hover:underline">
                      {meaningfulPass.draftName}
                    </Link>
                    <span className="text-xs text-slate-500">{meaningfulPass.leagueSize} teams</span>
                  </div>
                  <div className="mt-5 grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
                    <div>
                      <p className="text-xs font-bold tracking-wide text-emerald-400 uppercase">You selected</p>
                      <Link
                        href={{
                          pathname: `/players/${selectedPlayerSlug}`,
                          query: {
                            pool: activePoolSlug,
                          },
                        }}
                        className="font-bold text-sky-300 hover:text-sky-200 hover:underline"
                      >
                        {meaningfulPass.selectedPick.playerName}
                      </Link>
                      <p className="mt-1 text-sm text-slate-400">
                        {meaningfulPass.selectedPick.position} · Pick {meaningfulPass.selectedPick.pick}
                      </p>
                    </div>
                    <ArrowRight className="hidden text-slate-600 sm:block" size={20} />
                    <div>
                      <p className="text-xs font-bold tracking-wide text-amber-400 uppercase">Still available</p>
                      <p className="mt-2 font-bold text-white">{player.playerName}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        {meaningfulPass.passedPlayerPick.position} · Pick {meaningfulPass.passedPlayerPick.pick}
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-4">
                    <p className="text-xs text-slate-500">Selected later by {meaningfulPass.passedPlayerPick.fantasyTeam}</p>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${severityClasses}`}>
                      {severityLabel} · {meaningfulPass.passSeverity.toFixed(2)}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        <div className="mt-6 flex gap-3 rounded-xl border border-sky-500/20 bg-sky-500/5 p-4">
          <Info className="mt-0.5 shrink-0 text-sky-300" size={18} />
          <div>
            <h3 className="text-sm font-bold text-slate-200">About meaningful passes</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-400">A meaningful pass occurs when you select someone who typically drafts later while this player is still available. Higher severity means there was a larger difference between the players&apos; overall average draft positions.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

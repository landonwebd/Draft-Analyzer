"use client";

import { useEffect, useRef, useState } from "react";
import type { PositionBySlotAndRound } from "@/utils/buildPositionBySlotAndRound";
import { getPositionColor } from "@/utils/positionStyles";

type PositionBySlotAndRoundChartProps = {
  slotBreakdowns: PositionBySlotAndRound[];
};

export default function PositionBySlotAndRoundChart({ slotBreakdowns }: PositionBySlotAndRoundChartProps) {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const detailsRef = useRef<HTMLElement>(null);
  const selectedSlotBreakdown = slotBreakdowns.find(({ slot, draftCount }) => slot === selectedSlot && draftCount > 0) ?? null;

  useEffect(() => {
    if (selectedSlot === null) {
      return;
    }

    detailsRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [selectedSlot]);

  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold">Position by Draft Slot and Round</h2>

      <p className="mt-2 text-slate-400">Explore which positions you selected from each starting slot.</p>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {slotBreakdowns.map(({ slot, draftCount, rounds }) => {
          const firstRound = rounds.find((round) => round.round === 1);
          const firstRoundDraftCount = firstRound?.draftCount ?? 0;
          const firstRoundPositions = firstRound?.positions ?? [];

          return (
            <article key={slot} className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="font-bold">Slot {slot}</h3>

                <p className="text-sm text-slate-500">
                  {draftCount} {draftCount === 1 ? "draft" : "drafts"}
                </p>
              </div>

              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Round 1</p>

              {firstRoundPositions.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">No drafts from this slot.</p>
              ) : (
                <>
                  <div role="img" aria-label={`First-round position distribution for draft slot ${slot}`} className="mt-4 flex h-3 overflow-hidden rounded-full bg-slate-800">
                    {firstRoundPositions.map(({ position, draftRate }) => (
                      <span key={position} title={`${position}: ${(draftRate * 100).toFixed(1)}%`} className={`h-full ring-1 ring-inset ring-white/10 ${getPositionColor(position)}`} style={{ width: `${draftRate * 100}%` }} />
                    ))}
                  </div>

                  <dl className="mt-4 space-y-2">
                    {firstRoundPositions.map(({ position, draftCount: positionDraftCount, draftRate }) => (
                      <div key={position} className="flex items-center gap-3">
                        <dt className={`rounded-full px-2 py-1 text-xs font-bold ${getPositionColor(position)}`}>{position}</dt>

                        <dd className="ml-auto font-semibold tabular-nums">{(draftRate * 100).toFixed(1)}%</dd>

                        <dd className="w-12 text-right text-sm text-slate-500 tabular-nums">
                          {positionDraftCount}/{firstRoundDraftCount}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </>
              )}
              {draftCount > 0 && (
                <button
                  type="button"
                  aria-expanded={selectedSlot === slot}
                  aria-controls="selected-slot-round-details"
                  onClick={() => {
                    setSelectedSlot((currentSlot) => (currentSlot === slot ? null : slot));
                  }}
                  className="mt-5 w-full cursor-pointer rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-sky-300 hover:border-sky-700 hover:bg-sky-950/30 hover:text-sky-200"
                >
                  {selectedSlot === slot ? "Hide round details" : "View all rounds"}
                </button>
              )}
            </article>
          );
        })}
      </div>
      {selectedSlotBreakdown && (
        <section ref={detailsRef} id="selected-slot-round-details" className="mt-6 rounded-2xl border border-sky-900/70 bg-sky-950/20 p-5 sm:p-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-400">Draft Slot Details</p>

            <h3 className="mt-2 text-2xl font-bold">Drafting from Slot {selectedSlotBreakdown.slot}</h3>

            <p className="mt-2 text-sm text-slate-400">
              Position tendencies across {selectedSlotBreakdown.draftCount} {selectedSlotBreakdown.draftCount === 1 ? "draft" : "drafts"}.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {selectedSlotBreakdown.rounds.map(({ round, draftCount, positions }) => (
              <article key={round} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="flex items-baseline justify-between gap-4">
                  <h4 className="font-bold">Round {round}</h4>

                  <p className="text-xs text-slate-500">
                    {draftCount} {draftCount === 1 ? "draft" : "drafts"}
                  </p>
                </div>

                <div role="img" aria-label={`Round ${round} position distribution for draft slot ${selectedSlotBreakdown.slot}`} className="mt-4 flex h-3 overflow-hidden rounded-full bg-slate-800">
                  {positions.map(({ position, draftRate }) => (
                    <span key={position} title={`${position}: ${(draftRate * 100).toFixed(1)}%`} className={`h-full ring-1 ring-inset ring-white/10 ${getPositionColor(position)}`} style={{ width: `${draftRate * 100}%` }} />
                  ))}
                </div>

                <dl className="mt-4 space-y-2">
                  {positions.map(({ position, draftCount: positionDraftCount, draftRate }) => (
                    <div key={position} className="flex items-center gap-3">
                      <dt className={`rounded-full px-2 py-1 text-xs font-bold ${getPositionColor(position)}`}>{position}</dt>

                      <dd className="ml-auto font-semibold tabular-nums">{(draftRate * 100).toFixed(1)}%</dd>

                      <dd className="w-12 text-right text-sm text-slate-500 tabular-nums">
                        {positionDraftCount}/{draftCount}
                      </dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}

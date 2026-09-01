import type { FirstRoundPositionBySlot } from "@/utils/buildFirstRoundPositionBySlot";
import { getPositionColor } from "@/utils/positionStyles";

type FirstRoundPositionBySlotChartProps = {
  slotBreakdowns: FirstRoundPositionBySlot[];
};

export default function FirstRoundPositionBySlotChart({ slotBreakdowns }: FirstRoundPositionBySlotChartProps) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold">First-Round Position by Draft Slot</h2>
      <p className="mt-2 text-slate-400">Which position you selected first from each starting slot.</p>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {slotBreakdowns.map(({ slot, draftCount, positions }) => (
          <article key={slot} className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="font-bold">Slot {slot}</h3>
              <p className="text-sm text-slate-500">
                {draftCount} {draftCount === 1 ? "draft" : "drafts"}
              </p>
            </div>

            {positions.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">No drafts from this slot.</p>
            ) : (
              <>
                <div role="img" aria-label={`First-round position distribution for draft slot ${slot}`} className="mt-4 flex h-3 overflow-hidden rounded-full bg-slate-800">
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
              </>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

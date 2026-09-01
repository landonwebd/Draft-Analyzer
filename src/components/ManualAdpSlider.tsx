"use client";

import { useState } from "react";
import * as Slider from "@radix-ui/react-slider";
import { MANUAL_ADP_ADJUSTMENT_MAX, MANUAL_ADP_ADJUSTMENT_MIN } from "@/utils/playerRankingOverrideStorage";
import { MoveUp, MoveDown } from "lucide-react";

type ManualAdpSliderProps = {
  initialValue: number;
  onCommit: (value: number) => void;
};

const adjustmentMarks = [-100, -75, -50, -25, 0, 25, 50, 75, 100];

export default function ManualAdpSlider({ initialValue, onCommit }: ManualAdpSliderProps) {
  const [value, setValue] = useState(initialValue);
  const formattedAdjustment = value > 0 ? `Move down ${value}` : `Move up ${Math.abs(value)}`;
  const adjustmentLabel = value === 0 ? "No adjustment" : `${formattedAdjustment} ${Math.abs(value) === 1 ? "pick" : "picks"}`;

  return (
    <div className="mt-5">
      <div className="mb-3 flex gap-2 justify-between">
        <span className="flex gap-2 items-center rounded-full bg-sky-500/10 px-3 py-1 text-sm font-bold text-sky-300">
          <MoveUp size={16} /> <span className="hidden md:block">Move Up Rankings</span>
        </span>
        <output className="rounded-full bg-sky-500/10 px-3 py-1 text-sm font-bold text-sky-300">{adjustmentLabel}</output>
        <span className="flex gap-2 items-center rounded-full bg-sky-500/10 px-3 py-1 text-sm font-bold text-sky-300">
          <span className="hidden md:block">Move Down Rankings</span> <MoveDown size={16} />
        </span>
      </div>
      <Slider.Root
        min={MANUAL_ADP_ADJUSTMENT_MIN}
        max={MANUAL_ADP_ADJUSTMENT_MAX}
        step={1}
        value={[value]}
        onValueChange={([nextValue]) => {
          setValue(nextValue);
        }}
        onValueCommit={([committedValue]) => {
          onCommit(committedValue);
        }}
        aria-label="Manual ADP adjustment"
        className="relative flex h-6 w-full touch-none items-center select-none"
      >
        <Slider.Track className="relative h-2 grow overflow-hidden rounded-full bg-gradient-to-r from-emerald-500 via-sky-500 to-red-500"></Slider.Track>

        <Slider.Thumb className="block size-5 rounded-full border-2 border-sky-300 bg-slate-950 shadow-md outline-none focus-visible:ring-2 focus-visible:ring-sky-400" />
      </Slider.Root>

      <div aria-hidden="true" className="relative mt-1 h-7">
        {adjustmentMarks.map((mark) => {
          const percentage = ((mark - MANUAL_ADP_ADJUSTMENT_MIN) / (MANUAL_ADP_ADJUSTMENT_MAX - MANUAL_ADP_ADJUSTMENT_MIN)) * 100;
          // 20px matches the width of your size-5 Radix thumb
          const thumbWidth = 20;
          return (
            <div
              key={mark}
              style={{
                left: `calc(${percentage}% + ${(50 - percentage) * (thumbWidth / 100)}px)`,
              }}
              className="absolute top-0 flex w-0 flex-col items-center"
            >
              <span className="h-2 w-px shrink-0 bg-slate-600" />
              <span className="mt-1 text-xs text-slate-500">{mark}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

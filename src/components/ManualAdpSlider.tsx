"use client";

import { useState } from "react";
import * as Slider from "@radix-ui/react-slider";

type ManualAdpSliderProps = {
  initialValue: number;
  onCommit: (value: number) => void;
};

const adjustmentMarks = [-30, -25, -20, -15, -10, -5, 0, 5, 10, 15, 20, 25, 30];

export default function ManualAdpSlider({ initialValue, onCommit }: ManualAdpSliderProps) {
  const [value, setValue] = useState(initialValue);
  const formattedAdjustment = value > 0 ? `+${value}` : `${value}`;
  const adjustmentLabel = value === 0 ? "No adjustment" : `${formattedAdjustment} ${Math.abs(value) === 1 ? "pick" : "picks"}`;

  return (
    <div className="mt-5">
      <div className="mb-3 flex justify-end">
        <output className="rounded-full bg-sky-500/10 px-3 py-1 text-sm font-bold text-sky-300">{adjustmentLabel}</output>
      </div>
      <Slider.Root
        min={-30}
        max={30}
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
        <Slider.Track className="relative h-2 grow overflow-hidden rounded-full bg-slate-700">
          <Slider.Range className="absolute h-full bg-sky-500" />
        </Slider.Track>

        <Slider.Thumb className="block size-5 rounded-full border-2 border-sky-300 bg-slate-950 shadow-md outline-none focus-visible:ring-2 focus-visible:ring-sky-400" />
      </Slider.Root>

      <div aria-hidden="true" className="relative left-[calc(50%-10px)] mt-1 h-7">
        {adjustmentMarks.map((mark) => {
          const percentage = (mark / 60) * 100;
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

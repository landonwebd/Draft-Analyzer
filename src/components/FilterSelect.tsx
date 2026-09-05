"use client";

import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";

const EMPTY_OPTION_VALUE = "__filter-select-empty__";

export type SelectOption = {
  value: string;
  label: string;
};

type FilterSelectProps = {
  id: string;
  label: string;
  value: string;
  options: SelectOption[];
  onValueChange: (value: string) => void;
};

export default function FilterSelect({ id, label, value, options, onValueChange }: FilterSelectProps) {
  return (
    <Select.Root value={value === "" ? EMPTY_OPTION_VALUE : value} onValueChange={(nextValue) => onValueChange(nextValue === EMPTY_OPTION_VALUE ? "" : nextValue)}>
      <Select.Trigger id={id} aria-label={label} className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-500 bg-slate-900 px-4 py-3 text-left outline-none hover:border-slate-400 focus:border-emerald-400">
        <Select.Value />
        <Select.Icon>
          <ChevronDown aria-hidden="true" className="size-5 shrink-0 text-slate-400" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content position="popper" sideOffset={6} collisionPadding={12} className="z-50 w-[var(--radix-select-trigger-width)] max-h-[var(--radix-select-content-available-height)] overflow-hidden rounded-lg border border-slate-600 bg-slate-900 shadow-2xl">
          <Select.Viewport className="max-h-80 overflow-y-auto p-1">
            {options.map((option) => (
              <Select.Item key={option.value} value={option.value === "" ? EMPTY_OPTION_VALUE : option.value} className="relative cursor-pointer rounded-md py-2 pr-9 pl-3 text-sm text-slate-200 outline-none data-[highlighted]:bg-slate-700 data-[highlighted]:text-white data-[state=checked]:text-emerald-400">
                <Select.ItemText>{option.label}</Select.ItemText>
                <Select.ItemIndicator className="absolute top-1/2 right-3 -translate-y-1/2">
                  <Check aria-hidden="true" className="size-4" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

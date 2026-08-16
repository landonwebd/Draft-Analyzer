type SelectOption = {
  value: string;
  label: string;
};

type FilterSelectProps = {
  id: string;
  label: string;
  value: string;
  options: SelectOption[];
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
};

export default function FilterSelect({ id, label, value, options, onChange }: FilterSelectProps) {
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>

      <div className="relative w-full">
        <select id={id} autoComplete="off" value={value} onChange={onChange} className="w-full cursor-pointer appearance-none rounded-lg border border-slate-500 bg-slate-900 py-3 pr-10 pl-4">
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" className="pointer-events-none absolute top-1/2 right-3 size-6 -translate-y-1/2 text-slate-400">
          <path d="m6 8 4 4 4-4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

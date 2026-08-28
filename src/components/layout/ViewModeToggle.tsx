export type ViewMode = '3d' | '2d'

export function ViewModeToggle({ mode, onChange }: { mode: ViewMode; onChange: (mode: ViewMode) => void }) {
  const options: ViewMode[] = ['3d', '2d']

  return (
    <div className="absolute bottom-4 right-4 z-10 flex gap-0.5 rounded-full border border-(--color-line) bg-(--color-panel) p-1 shadow-[0_2px_8px_rgba(16,40,60,0.12)]">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`rounded-full px-3.5 py-1.5 text-[12px] font-bold uppercase tracking-wide transition-colors ${
            mode === opt ? 'bg-(--color-brand) text-white' : 'text-(--color-ink-faint) hover:bg-(--color-panel-soft) hover:text-(--color-ink-soft)'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

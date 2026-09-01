import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group'

export type ViewMode = '3d' | '2d'

export function ViewModeToggle({ mode, onChange }: { mode: ViewMode; onChange: (mode: ViewMode) => void }) {
  const options: ViewMode[] = ['3d', '2d']

  return (
    <ToggleGroup
      variant="default"
      spacing={1}
      value={[mode]}
      onValueChange={(value) => value[0] && onChange(value[0] as ViewMode)}
      className="glass-panel absolute bottom-4 right-4 z-10 rounded-full p-1"
    >
      {options.map((opt) => (
        <ToggleGroupItem
          key={opt}
          value={opt}
          className="rounded-full px-3.5 py-1.5 text-[12px] font-bold uppercase tracking-wide text-(--color-ink-faint) hover:bg-(--color-panel-soft) hover:text-(--color-ink-soft) data-pressed:bg-(--color-navy) data-pressed:text-white data-pressed:hover:bg-(--color-navy)"
        >
          {opt}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

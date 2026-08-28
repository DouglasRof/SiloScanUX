import { useSiloStore } from '../../store/useSiloStore'
import { SiloElevationView } from './SiloElevationView'
import { SiloPlanView } from './SiloPlanView'

export function Silo2DView() {
  const dims = useSiloStore((s) => s.dims)
  const volume = useSiloStore((s) => s.volume)

  return (
    <div className="flex h-full w-full items-center justify-center gap-6 bg-linear-to-b from-(--color-app-from) to-(--color-app-to) p-6">
      <div className="flex h-full max-w-[420px] flex-1 flex-col items-center gap-2 rounded-2xl border border-(--color-line) bg-(--color-panel) p-4">
        <p className="text-[11px] font-bold tracking-wide text-(--color-ink-faint)">CORTE FRONTAL</p>
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <SiloElevationView dims={dims} volume={volume} />
        </div>
      </div>

      <div className="flex h-full max-w-[420px] flex-1 flex-col items-center gap-2 rounded-2xl border border-(--color-line) bg-(--color-panel) p-4">
        <p className="text-[11px] font-bold tracking-wide text-(--color-ink-faint)">VISTA SUPERIOR — TOPOGRAFIA</p>
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <SiloPlanView dims={dims} volume={volume} />
        </div>
      </div>
    </div>
  )
}

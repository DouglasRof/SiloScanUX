import { useSiloStore } from '../../store/useSiloStore'
import { formatDateTime, formatNumber, formatTon } from '../../lib/format'
import { Modal } from './Modal'
import { Button } from '../ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'

function toCsv(rows: { t: number; levelPercent: number; volumeM3: number; massTon: number }[]): string {
  const header = 'timestamp,data_hora,nivel_pct,volume_m3,massa_t'
  const lines = rows.map((r) => `${r.t},${formatDateTime(r.t)},${r.levelPercent.toFixed(2)},${r.volumeM3.toFixed(2)},${r.massTon.toFixed(2)}`)
  return [header, ...lines].join('\n')
}

export function ReportsModal({ onClose }: { onClose: () => void }) {
  const history = useSiloStore((s) => s.history)
  const volume = useSiloStore((s) => s.volume)
  const siloName = useSiloStore((s) => s.siloName)
  const dims = useSiloStore((s) => s.dims)
  const grain = useSiloStore((s) => s.grain)

  const recent = [...history].reverse().slice(0, 20)

  function handleExport() {
    const csv = toCsv(history)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${siloName.replace(/\s+/g, '_').toLowerCase()}_historico.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Modal title="Relatório do silo" onClose={onClose} width={560}>
      <div className="grid grid-cols-2 gap-3 rounded-xl bg-(--color-panel-soft) p-3.5 sm:grid-cols-3">
        <div>
          <p className="text-[11px] font-bold text-(--color-ink-faint)">SILO</p>
          <p className="text-sm font-semibold">{siloName}</p>
        </div>
        <div>
          <p className="text-[11px] font-bold text-(--color-ink-faint)">DIMENSÕES</p>
          <p className="text-sm font-semibold">
            Ø{dims.diameterM}m × {dims.cylinderHeightM}m
          </p>
        </div>
        <div>
          <p className="text-[11px] font-bold text-(--color-ink-faint)">PRODUTO</p>
          <p className="text-sm font-semibold">{grain.name}</p>
        </div>
        <div>
          <p className="text-[11px] font-bold text-(--color-ink-faint)">VOLUME ATUAL</p>
          <p className="text-sm font-semibold">{formatNumber(volume.volumeM3)} m³</p>
        </div>
        <div>
          <p className="text-[11px] font-bold text-(--color-ink-faint)">MASSA ATUAL</p>
          <p className="text-sm font-semibold">{formatTon(volume.massTon)} t</p>
        </div>
        <div>
          <p className="text-[11px] font-bold text-(--color-ink-faint)">CAPACIDADE NOMINAL</p>
          <p className="text-sm font-semibold">{formatNumber(volume.totalCapacityM3)} m³</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-[11px] font-bold tracking-wide text-(--color-ink-faint)">HISTÓRICO RECENTE</p>
        <Button onClick={handleExport} variant="secondary" className="h-auto rounded-lg px-3 py-1.5 text-xs font-semibold">
          Exportar CSV
        </Button>
      </div>

      <div className="mt-2 max-h-64 overflow-auto rounded-xl border border-(--color-line) scroll-slim">
        <Table className="min-w-[420px] text-[12px]">
          <TableHeader className="sticky top-0 bg-(--color-panel-soft) text-(--color-ink-faint)">
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead className="h-auto px-3 py-2 font-semibold text-(--color-ink-faint)">Data/Hora</TableHead>
              <TableHead className="h-auto px-3 py-2 font-semibold text-(--color-ink-faint)">Nível</TableHead>
              <TableHead className="h-auto px-3 py-2 font-semibold text-(--color-ink-faint)">Volume</TableHead>
              <TableHead className="h-auto px-3 py-2 font-semibold text-(--color-ink-faint)">Massa</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recent.map((r) => (
              <TableRow key={r.t} className="border-t border-(--color-line) hover:bg-transparent">
                <TableCell className="tabular px-3 py-1.5">{formatDateTime(r.t)}</TableCell>
                <TableCell className="tabular px-3 py-1.5">{r.levelPercent.toFixed(0)}%</TableCell>
                <TableCell className="tabular px-3 py-1.5">{formatNumber(r.volumeM3)} m³</TableCell>
                <TableCell className="tabular px-3 py-1.5">{formatTon(r.massTon)} t</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Modal>
  )
}

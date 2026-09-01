import { useEffect, useState } from 'react'
import { adminListPropertiesWithSilos, type AdminPropertyWithSilos } from '../../lib/admin'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'

export function AdminPropertiesTab() {
  const [properties, setProperties] = useState<AdminPropertyWithSilos[] | null>(null)

  useEffect(() => {
    adminListPropertiesWithSilos().then(setProperties)
  }, [])

  if (properties === null) {
    return <p className="text-sm text-(--color-ink-faint)">Carregando propriedades…</p>
  }

  if (properties.length === 0) {
    return <p className="text-sm text-(--color-ink-faint)">Nenhuma propriedade cadastrada ainda.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[11px] text-(--color-ink-faint)">
        Visão de todas as propriedades e silos de todos os usuários — fora da regra normal de "cada um só vê o próprio".
      </p>
      <div className="overflow-x-auto rounded-xl border border-(--color-line)">
        <Table className="min-w-[560px] text-[13px]">
          <TableHeader className="bg-(--color-panel-soft) text-[11px] font-bold uppercase tracking-wide text-(--color-ink-faint)">
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead className="h-auto px-3 py-2 text-(--color-ink-faint)">Propriedade</TableHead>
              <TableHead className="h-auto px-3 py-2 text-(--color-ink-faint)">ID do usuário dono</TableHead>
              <TableHead className="h-auto px-3 py-2 text-(--color-ink-faint)">Silos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {properties.map((p) => (
              <TableRow key={p.id} className="border-t border-(--color-line) align-top hover:bg-transparent">
                <TableCell className="px-3 py-2 font-medium text-(--color-ink)">{p.nome}</TableCell>
                <TableCell className="px-3 py-2 font-mono text-[11px] text-(--color-ink-faint)">{p.userId}</TableCell>
                <TableCell className="px-3 py-2 text-(--color-ink-soft)">{p.silos.length === 0 ? '—' : p.silos.map((s) => s.nome).join(', ')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

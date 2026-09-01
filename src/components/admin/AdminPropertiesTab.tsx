import { useEffect, useState } from 'react'
import { adminListPropertiesWithSilos, type AdminPropertyWithSilos } from '../../lib/admin'

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
        <table className="w-full min-w-[560px] text-left text-[13px]">
          <thead className="bg-(--color-panel-soft) text-[11px] font-bold uppercase tracking-wide text-(--color-ink-faint)">
            <tr>
              <th className="px-3 py-2">Propriedade</th>
              <th className="px-3 py-2">ID do usuário dono</th>
              <th className="px-3 py-2">Silos</th>
            </tr>
          </thead>
          <tbody>
            {properties.map((p) => (
              <tr key={p.id} className="border-t border-(--color-line) align-top">
                <td className="px-3 py-2 font-medium text-(--color-ink)">{p.nome}</td>
                <td className="px-3 py-2 font-mono text-[11px] text-(--color-ink-faint)">{p.userId}</td>
                <td className="px-3 py-2 text-(--color-ink-soft)">
                  {p.silos.length === 0 ? '—' : p.silos.map((s) => s.nome).join(', ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

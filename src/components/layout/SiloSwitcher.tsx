import { useEffect, useRef, useState } from 'react'
import type { SiloSummary } from '../../types/silo'
import { ChevronDownIcon, PlusIcon, TrashIcon } from '../icons'

interface SiloSwitcherProps {
  silos: SiloSummary[]
  activeSiloId: string | null
  onSwitch: (id: string) => void
  onCreate: () => void
  onDelete: (id: string) => void
}

export function SiloSwitcher({ silos, activeSiloId, onSwitch, onCreate, onDelete }: SiloSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const activeName = silos.find((s) => s.id === activeSiloId)?.nome ?? '—'

  function close() {
    setIsOpen(false)
    setConfirmDeleteId(null)
  }

  useEffect(() => {
    if (!isOpen) return
    function handleClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) close()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen])

  return (
    <div ref={rootRef} className="absolute left-1/2 -translate-x-1/2">
      <button
        onClick={() => (isOpen ? close() : setIsOpen(true))}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[13px] font-bold tracking-[0.14em] text-(--color-ink-soft) hover:bg-(--color-panel-soft)"
      >
        DASHBOARD DE CAPACIDADE — {activeName}
        <ChevronDownIcon />
      </button>

      {isOpen && (
        <div className="absolute left-1/2 top-full z-20 mt-1 w-72 -translate-x-1/2 rounded-xl border border-(--color-line) bg-(--color-panel) py-1.5 text-left normal-case shadow-lg">
          {silos.map((silo) =>
            confirmDeleteId === silo.id ? (
              <div key={silo.id} className="mx-1.5 my-0.5 flex items-center gap-1.5 rounded-lg bg-(--color-danger-soft) px-2.5 py-1.5">
                <span className="flex-1 truncate text-[12px] font-semibold text-(--color-danger)">Excluir "{silo.nome}"?</span>
                <button
                  onClick={() => {
                    onDelete(silo.id)
                    setConfirmDeleteId(null)
                  }}
                  className="rounded-md bg-(--color-danger) px-2 py-1 text-[11px] font-bold text-white hover:brightness-95"
                >
                  Excluir
                </button>
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="rounded-md px-2 py-1 text-[11px] font-semibold text-(--color-ink-soft) hover:bg-(--color-panel-soft)"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <div key={silo.id} className="flex items-center gap-1 px-1.5">
                <button
                  onClick={() => {
                    onSwitch(silo.id)
                    close()
                  }}
                  className={`flex-1 truncate rounded-lg px-2.5 py-1.5 text-left text-[13px] font-semibold tracking-normal ${
                    silo.id === activeSiloId ? 'bg-(--color-brand-soft) text-(--color-brand-dark)' : 'text-(--color-ink) hover:bg-(--color-panel-soft)'
                  }`}
                >
                  {silo.nome}
                </button>
                {silos.length > 1 && (
                  <button
                    onClick={() => setConfirmDeleteId(silo.id)}
                    title="Excluir silo"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-(--color-ink-faint) hover:bg-(--color-danger-soft) hover:text-(--color-danger)"
                  >
                    <TrashIcon />
                  </button>
                )}
              </div>
            ),
          )}

          <div className="mx-1.5 mt-1 border-t border-(--color-line) pt-1">
            <button
              onClick={() => {
                onCreate()
                close()
              }}
              className="flex w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] font-semibold tracking-normal text-(--color-brand-dark) hover:bg-(--color-brand-soft)"
            >
              <PlusIcon /> Novo silo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import type { PropertySummary, SiloSummary } from '../../types/silo'
import { ChevronDownIcon, ChevronLeftIcon, HomeIcon, PencilIcon, PlusIcon, TrashIcon } from '../icons'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '../ui/dropdown-menu'

interface PropertySiloSwitcherProps {
  properties: PropertySummary[]
  silos: SiloSummary[]
  activePropertyId: string | null
  activeSiloId: string | null
  onSwitchProperty: (id: string) => void
  onSwitchSilo: (id: string) => void
  onCreateProperty: () => void
  onCreateSilo: () => void
  onDeleteSilo: (id: string) => Promise<boolean>
  onRenameProperty: (propertyId: string, currentName: string) => void
}

type Confirm = { kind: 'silo'; id: string; failed: boolean; deleting: boolean } | null

export function PropertySiloSwitcher({
  properties,
  silos,
  activePropertyId,
  activeSiloId,
  onSwitchProperty,
  onSwitchSilo,
  onCreateProperty,
  onCreateSilo,
  onDeleteSilo,
  onRenameProperty,
}: PropertySiloSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [confirm, setConfirm] = useState<Confirm>(null)
  // null = mostrando a lista de propriedades; setado = mostrando o submenu de silos
  // filtrado para essa propriedade. Guarda só o id (não o objeto inteiro) e busca o
  // nome atual em `properties` a cada render, pra não travar num nome antigo se a
  // propriedade for renomeada com o submenu aberto.
  const [viewPropertyId, setViewPropertyId] = useState<string | null>(null)

  const activePropertyName = properties.find((p) => p.id === activePropertyId)?.nome ?? '—'
  const activeSiloName = silos.find((s) => s.id === activeSiloId)?.nome ?? '—'
  const viewProperty = viewPropertyId ? properties.find((p) => p.id === viewPropertyId) ?? null : null

  // DropdownMenu já cobre clique fora/Escape (Base UI Menu) — aqui só reseta o
  // estado interno (confirmação de exclusão, submenu de silos) sempre que fecha,
  // não importa se foi um clique numa ação ou um dismiss externo.
  function handleOpenChange(open: boolean) {
    setIsOpen(open)
    if (!open) {
      setConfirm(null)
      setViewPropertyId(null)
    }
  }
  const close = () => handleOpenChange(false)

  function selectProperty(property: PropertySummary) {
    onSwitchProperty(property.id)
    setConfirm(null)
    setViewPropertyId(property.id)
  }

  async function handleConfirmDelete(siloId: string) {
    setConfirm({ kind: 'silo', id: siloId, failed: false, deleting: true })
    const ok = await onDeleteSilo(siloId)
    setConfirm(ok ? null : { kind: 'silo', id: siloId, failed: true, deleting: false })
  }

  return (
    <div className="absolute left-1/2 -translate-x-1/2">
      <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger className="glass-panel flex max-w-[70vw] items-center gap-2 rounded-full px-5 py-2.5 text-[13px] text-(--color-ink) outline-none transition-colors hover:brightness-95">
          <span className="shrink-0">
            <HomeIcon />
          </span>
          <span className="hidden shrink-0 font-bold sm:inline">Propriedade:</span>
          <span className="truncate font-normal">
            {activePropertyName} · {activeSiloName}
          </span>
          <ChevronDownIcon />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="center"
          className="w-[calc(100vw-2rem)] max-w-80 rounded-2xl border border-(--color-line) bg-(--color-panel) py-1.5 text-left normal-case shadow-lg"
        >
          {viewProperty === null ? (
            <>
              {properties.map((property) => {
                const isActiveProperty = property.id === activePropertyId
                return (
                  <div key={property.id} className="mx-1.5 mb-0.5 flex items-center gap-0.5">
                    <button
                      onClick={() => selectProperty(property)}
                      className={`flex flex-1 items-center gap-1 truncate rounded-lg px-2.5 py-1.5 text-left text-[13px] font-semibold tracking-normal ${
                        isActiveProperty ? 'bg-(--color-navy-soft) text-(--color-navy)' : 'text-(--color-ink) hover:bg-(--color-panel-soft)'
                      }`}
                    >
                      <span className="flex-1 truncate">{property.nome}</span>
                      <ChevronDownIcon />
                    </button>
                    <button
                      onClick={() => {
                        onRenameProperty(property.id, property.nome)
                        close()
                      }}
                      title="Renomear propriedade"
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-(--color-ink-faint) hover:bg-(--color-panel-soft) hover:text-(--color-ink-soft)"
                    >
                      <PencilIcon />
                    </button>
                  </div>
                )
              })}

              <div className="mx-1.5 mt-1 border-t border-(--color-line) pt-1">
                <button
                  onClick={() => {
                    onCreateProperty()
                    close()
                  }}
                  className="flex w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] font-semibold tracking-normal text-(--color-navy) hover:bg-(--color-navy-soft)"
                >
                  <PlusIcon /> Nova propriedade
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mx-1.5 mb-1 flex items-center gap-1 border-b border-(--color-line) pb-1.5">
                <button
                  onClick={() => setViewPropertyId(null)}
                  title="Voltar para propriedades"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-(--color-ink-faint) hover:bg-(--color-panel-soft) hover:text-(--color-ink-soft)"
                >
                  <ChevronLeftIcon />
                </button>
                <span className="flex-1 truncate text-[11px] font-bold tracking-wide text-(--color-ink-faint)">{viewProperty.nome.toUpperCase()}</span>
              </div>

              {silos
                .filter((s) => s.propriedadeId === viewProperty.id)
                .map((silo, _idx, propertySilos) =>
                  confirm?.kind === 'silo' && confirm.id === silo.id ? (
                    <div key={silo.id} className="mx-1.5 my-0.5 flex flex-col gap-1 rounded-lg bg-(--color-danger-soft) px-2.5 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="flex-1 truncate text-[12px] font-semibold text-(--color-danger)">Excluir "{silo.nome}"?</span>
                        <button
                          onClick={() => handleConfirmDelete(silo.id)}
                          disabled={confirm.deleting}
                          className="rounded-md bg-(--color-danger) px-2 py-1 text-[11px] font-bold text-white hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {confirm.deleting ? 'Excluindo…' : 'Excluir'}
                        </button>
                        <button
                          onClick={() => setConfirm(null)}
                          disabled={confirm.deleting}
                          className="rounded-md px-2 py-1 text-[11px] font-semibold text-(--color-ink-soft) hover:bg-(--color-panel-soft) disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Cancelar
                        </button>
                      </div>
                      {confirm.failed && (
                        <span className="text-[11px] font-medium text-(--color-danger)" role="alert">
                          Não foi possível excluir. Tente novamente.
                        </span>
                      )}
                    </div>
                  ) : (
                    <div key={silo.id} className="flex items-center gap-1 px-1.5">
                      <button
                        onClick={() => {
                          onSwitchSilo(silo.id)
                          close()
                        }}
                        className={`flex-1 truncate rounded-lg px-2.5 py-1.5 text-left text-[13px] font-semibold tracking-normal ${
                          silo.id === activeSiloId ? 'bg-(--color-navy-soft) text-(--color-navy)' : 'text-(--color-ink) hover:bg-(--color-panel-soft)'
                        }`}
                      >
                        {silo.nome}
                      </button>
                      {propertySilos.length > 1 && (
                        <button
                          onClick={() => setConfirm({ kind: 'silo', id: silo.id, failed: false, deleting: false })}
                          title="Excluir silo"
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-(--color-ink-faint) hover:bg-(--color-danger-soft) hover:text-(--color-danger)"
                        >
                          <TrashIcon />
                        </button>
                      )}
                    </div>
                  ),
                )}

              <button
                onClick={() => {
                  onCreateSilo()
                  close()
                }}
                className="mx-1.5 mt-0.5 flex w-[calc(100%-0.75rem)] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-left text-[12px] font-semibold tracking-normal text-(--color-navy) hover:bg-(--color-navy-soft)"
              >
                <PlusIcon /> Novo silo em {viewProperty.nome}
              </button>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

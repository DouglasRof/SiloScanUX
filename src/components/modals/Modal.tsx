import type { ReactNode } from 'react'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
  width?: number
}

export function Modal({ title, onClose, children, width = 480 }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-[2px]" onClick={onClose}>
      <div
        className="max-h-[85vh] overflow-y-auto rounded-2xl bg-(--color-panel) shadow-2xl scroll-slim"
        style={{ width }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-(--color-line) bg-(--color-panel) px-5 py-4">
          <h2 className="text-[15px] font-bold text-(--color-ink)">{title}</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-(--color-ink-faint) hover:bg-(--color-panel-soft)">
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

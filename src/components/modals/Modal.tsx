import type { ReactNode } from 'react'
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
  width?: number
  closeOnBackdropClick?: boolean
}

export function Modal({ title, onClose, children, width = 480, closeOnBackdropClick = true }: ModalProps) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()} disablePointerDismissal={!closeOnBackdropClick}>
      <DialogContent
        className="max-h-[85vh] w-full max-w-none gap-0 overflow-hidden rounded-3xl border-0 bg-(--color-panel) p-0 ring-0 shadow-2xl sm:max-w-none"
        style={{ maxWidth: width }}
      >
        {/* O scroll fica aqui dentro, não no Popup — o botão de fechar (X) é irmão
            desta div, renderizado direto no Popup (ver dialog.tsx), então rolar o
            conteúdo não o arrasta junto. */}
        <div className="flex max-h-[85vh] flex-col overflow-y-auto scroll-slim">
          <div className="sticky top-0 flex items-center justify-between border-b border-(--color-line) bg-(--color-panel) px-5 py-4 pr-12">
            <DialogTitle className="text-[15px] font-bold text-(--color-ink)">{title}</DialogTitle>
          </div>
          <div className="p-5">{children}</div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

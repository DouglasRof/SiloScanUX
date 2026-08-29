import { useEffect, useRef, type ReactNode } from 'react'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
  width?: number
  closeOnBackdropClick?: boolean
}

export function Modal({ title, onClose, children, width = 480, closeOnBackdropClick = true }: ModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  // onClose is an inline function at every call site, so a new reference lands on every
  // parent render (e.g. typing into a field elsewhere in the app). Reading it through a ref
  // keeps Escape wired to the latest callback without re-running the effect below — which
  // would otherwise steal focus back to the close button on every keystroke.
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    closeButtonRef.current?.focus()

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus()
    }
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-[2px]"
      onClick={closeOnBackdropClick ? onClose : undefined}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="max-h-[85vh] overflow-y-auto rounded-2xl bg-(--color-panel) shadow-2xl scroll-slim"
        style={{ width }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-(--color-line) bg-(--color-panel) px-5 py-4">
          <h2 id="modal-title" className="text-[15px] font-bold text-(--color-ink)">
            {title}
          </h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-(--color-ink-faint) hover:bg-(--color-panel-soft)"
          >
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

/**
 * Recreated as a vector from the InovAgroTec logo shared in chat (a brain outline with
 * circuit-board traces) — the original was a low-res raster, so this redraws it instead
 * of upscaling, and themes with the app's ink/brand tokens instead of fixed colors.
 */
export function BrandIcon({ className = 'h-12 w-12' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none">
      <path
        d="M31 30
           C 24 30 19 35 19 41
           C 14 43 11 48 12 54
           C 9 57 8 62 11 67
           C 10 73 14 79 21 80
           C 23 85 28 88 34 87
           C 36 91 41 93 46 92
           C 48 95 53 96 57 94
           C 62 96 68 94 71 90
           C 77 90 82 86 84 80
           C 90 78 94 72 93 66
           C 96 61 95 55 91 51
           C 92 45 89 39 83 37
           C 82 31 76 27 70 28
           C 68 23 62 20 56 22
           C 53 18 47 17 43 20
           C 39 17 33 19 31 24
           Z"
        fill="var(--color-panel)"
        stroke="var(--color-ink)"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M52 24 C 49 38 55 48 51 58 C 48 66 54 76 51 92"
        stroke="var(--color-ink)"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
        opacity={0.85}
      />
      <path
        d="M27 38c4 3 9 3 13 0M25 52c4 3 9 3 13 0M29 66c4 3 9 3 13 0M60 40c4 3 9 3 13 0M62 54c4 3 9 3 13 0M58 68c4 3 9 3 13 0"
        stroke="var(--color-ink)"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
        opacity={0.6}
      />

      <g stroke="var(--color-good)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M12 54H2v-9" />
        <path d="M93 51h9v10" />
        <path d="M46 92v9h13" />
        <path d="M43 20l-5-9h-11" />
        <path d="M70 28l7-8h10" />
      </g>
      <g fill="var(--color-good)">
        <rect x="-1" y="41.5" width="6" height="6" rx="1.2" />
        <rect x="95" y="55.5" width="6" height="6" rx="1.2" />
        <rect x="56" y="98" width="6" height="6" rx="1.2" />
        <rect x="23" y="6" width="6" height="6" rx="1.2" />
        <rect x="84" y="15" width="6" height="6" rx="1.2" />
      </g>
    </svg>
  )
}

export function BrandWordmark({ className = 'text-xl' }: { className?: string }) {
  return (
    <span className={`font-mono font-extrabold tracking-tight ${className}`}>
      <span className="text-(--color-ink-faint)">{'<'}</span>
      <span className="text-(--color-ink)">Inov</span>
      <span className="text-(--color-good)">AgroTec</span>
      <span className="text-(--color-ink-faint)">{'/>'}</span>
    </span>
  )
}

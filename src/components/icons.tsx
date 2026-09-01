export function SiloLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
      <rect x="3" y="9" width="14" height="11" rx="1.4" fill="var(--color-navy)" opacity="0.15" />
      <path d="M3 9 10 4l7 5" stroke="var(--color-navy)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect x="3" y="9" width="14" height="11" rx="1.4" stroke="var(--color-navy)" strokeWidth="1.8" fill="none" />
      <path d="M6.5 13.5h7" stroke="var(--color-navy)" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className="h-5 w-5">
      <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 9.5V19a1 1 0 0 0 1 1H10a.5.5 0 0 0 .5-.5V15a1.5 1.5 0 0 1 3 0v4.5a.5.5 0 0 0 .5.5h3.5a1 1 0 0 0 1-1V9.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ClipboardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className="h-5 w-5">
      <rect x="5.5" y="4.5" width="13" height="16" rx="1.8" />
      <path d="M9 4.5V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v.5" strokeLinecap="round" />
      <path d="M8.5 11h7M8.5 15h7M8.5 19h4" strokeLinecap="round" />
    </svg>
  )
}

// Rounded-tooth cog — deliberately distinct from a sun icon (rays only, no rim/teeth).
export function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" stroke="currentColor" className="h-5 w-5">
      <circle cx="12" cy="12" r="3" />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82A1.65 1.65 0 0 0 3 13.09H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className="h-5 w-5">
      <path d="M6 10a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 18.5a2 2 0 0 0 4 0" strokeLinecap="round" />
    </svg>
  )
}

export function HelpIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className="h-5 w-5">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.6 9.3a2.4 2.4 0 1 1 3.5 2.1c-.8.5-1.1.9-1.1 1.9" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="16.7" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className="h-5 w-5">
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" strokeLinecap="round" />
    </svg>
  )
}

export function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className="h-5 w-5">
      <path d="M15 4.5h2.5a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H15" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 8l4 4-4 4M15 12H3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className="h-5 w-5">
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.5M12 19v2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M2.5 12H5M19 12h2.5M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8" strokeLinecap="round" />
    </svg>
  )
}

export function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className="h-5 w-5">
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" className="h-3.5 w-3.5">
      <path d="M6 9.5 12 15l6-5.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" className="h-3.5 w-3.5">
      <path d="M14.5 6 9 12l5.5 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" className="h-4 w-4">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  )
}

export function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className="h-4 w-4">
      <path d="M4.5 7h15M9.5 7V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v2M18 7l-.7 12.1a2 2 0 0 1-2 1.9H8.7a2 2 0 0 1-2-1.9L6 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className="h-5 w-5">
      <path d="M4.5 4.5v14a1 1 0 0 0 1 1h14" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.5 16 11 11.5l3 2.5 4.5-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className="h-5 w-5">
      <path d="M12 3.5 19.5 6.5V11.5C19.5 16 16.5 19.5 12 21C7.5 19.5 4.5 16 4.5 11.5V6.5L12 3.5Z" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function KeyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className="h-5 w-5">
      <circle cx="8" cy="8" r="4" />
      <path d="M11 11 20 20M20 20l-2.5-.2M20 20l.2-2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function BuildingIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className="h-5 w-5">
      <rect x="4.5" y="3.5" width="9" height="17" rx="1" />
      <rect x="13.5" y="9.5" width="6" height="11" rx="1" />
      <path d="M7.5 7.5h3M7.5 11h3M7.5 14.5h3M16 13h1M16 16.5h1" strokeLinecap="round" />
    </svg>
  )
}

export function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className="h-5 w-5">
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" strokeLinecap="round" />
      <path d="M15.5 6.2a3 3 0 0 1 0 5.7M18 19a5 5 0 0 0-3.5-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className="h-3.5 w-3.5">
      <path d="M15.5 4.5 19.5 8.5 8 20H4v-4L15.5 4.5Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.5 6.5 17.5 10.5" strokeLinecap="round" />
    </svg>
  )
}

export function TrendIcon({ up }: { up: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`h-4 w-4 ${up ? 'text-(--color-good)' : 'text-(--color-danger)'}`}>
      {up ? <path d="M4 16 10 10l4 4 6-7" strokeLinecap="round" strokeLinejoin="round" /> : <path d="M4 8l6 6 4-4 6 7" strokeLinecap="round" strokeLinejoin="round" />}
      <path d={up ? 'M16 8h4v4' : 'M16 16h4v-4'} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement> & { size?: number }

function base({ size = 24, ...rest }: P) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    ...rest,
  }
}

export const EyeOpen = (p: P) => (
  <svg {...base(p)}>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)
/** Closed eye with lashes, like the reference. */
export const EyeClosed = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 9c2.4 3 5.4 4.5 9 4.5S18.6 12 21 9" />
    <path d="M6 12.2 4.5 14.5M12 13.5V16M18 12.2l1.5 2.3M9 13.1l-.8 2.5M15 13.1l.8 2.5" />
  </svg>
)
export const Search = (p: P) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
)
export const Help = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9.5" />
    <path d="M9.5 9.5a2.6 2.6 0 0 1 5 .8c0 1.7-2.5 2.2-2.5 3.7M12 17.2h.01" />
  </svg>
)
export const Shield = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 2.8 4.5 5.6v5.6c0 4.7 3.2 8.6 7.5 9.9 4.3-1.3 7.5-5.2 7.5-9.9V5.6Z" />
    <rect x="9" y="11" width="6" height="4.6" rx="1" />
    <path d="M10.2 11V9.6a1.8 1.8 0 0 1 3.6 0V11" />
  </svg>
)
export const ChevronRight = (p: P) => (
  <svg {...base(p)}>
    <path d="m9 5 7 7-7 7" />
  </svg>
)
export const ArrowLeft = (p: P) => (
  <svg {...base(p)}>
    <path d="M20 12H4M10 6l-6 6 6 6" />
  </svg>
)
export const ArrowUp = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </svg>
)
export const ArrowDown = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 5v14M6 13l6 6 6-6" />
  </svg>
)
export const Coin = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M14.8 9.2c-.5-.9-1.6-1.4-2.8-1.4-1.6 0-2.8.8-2.8 2.1 0 2.9 5.8 1.4 5.8 4.2 0 1.3-1.3 2.1-3 2.1-1.3 0-2.4-.6-2.9-1.5M12 6v1.8M12 16.2V18" />
  </svg>
)
export const Phone = (p: P) => (
  <svg {...base(p)}>
    <rect x="6.5" y="2.5" width="11" height="19" rx="2.2" />
    <path d="M13.3 9.2c-.3-.5-.8-.8-1.4-.8-.8 0-1.4.4-1.4 1.1 0 1.5 2.9.8 2.9 2.2 0 .7-.7 1.1-1.5 1.1-.6 0-1.2-.3-1.5-.8M12 7.4v1M12 12.8v1M10.5 18h3" />
  </svg>
)
export const Transfer = (p: P) => (
  <svg {...base(p)}>
    <path d="M12.6 20.5A8.5 8.5 0 1 1 20.5 11" />
    <path d="M14.2 9.6c-.4-.7-1.2-1.1-2.1-1.1-1.2 0-2.1.6-2.1 1.6 0 2.2 4.3 1 4.3 3.1 0 1-1 1.6-2.2 1.6-1 0-1.8-.4-2.2-1.1M12 7.2v1.3M12 14.8v1.3" />
    <path d="M17 6.5 19.5 4l2.5 2.5M19.5 4v6" />
  </svg>
)
export const Target = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.2" />
  </svg>
)
export const PixIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="m12 3 3.6 3.6-3.6 3.6-3.6-3.6Z" />
    <path d="m12 13.8 3.6 3.6L12 21l-3.6-3.6Z" />
    <path d="m6.6 8.4 3.6 3.6-3.6 3.6L3 12Z" />
    <path d="m17.4 8.4L21 12l-3.6 3.6-3.6-3.6Z" />
  </svg>
)
export const Home = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <path d="M12 3.2 3 10.4V20a1 1 0 0 0 1 1h5.2v-6.2h5.6V21H20a1 1 0 0 0 1-1v-9.6Z" />
  </svg>
)
export const Forum = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 20 18 5M4 20l12-8M4 20l13-4M4 20l9-13M4 20h15" />
  </svg>
)
export const Bag = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <path d="M8 7V6a4 4 0 0 1 8 0v1h2.4a1 1 0 0 1 1 .9l1 12.4a1.6 1.6 0 0 1-1.6 1.7H5.2a1.6 1.6 0 0 1-1.6-1.7l1-12.4a1 1 0 0 1 1-.9Zm1.8 0h4.4V6a2.2 2.2 0 0 0-4.4 0Z" />
  </svg>
)
export const Chart = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <path d="M3 20.5V9.5l5 3.5 4-6 4 4 5-6v15.5Z" />
  </svg>
)
export const Pencil = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 20h4L19.2 8.8a2.8 2.8 0 0 0-4-4L4 16Z" />
    <path d="M13.5 6.5l4 4M12 20h8" />
  </svg>
)
export const Plus = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)
export const Close = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
)
export const Face = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" />
    <path d="M9 9.5v1M15 9.5v1M12 9.5v3.5h-1M9 15.5c1.6 1.4 4.4 1.4 6 0" />
  </svg>
)
export const Salary = (p: P) => (
  <svg {...base(p)}>
    <rect x="4" y="4" width="16" height="14" rx="2" />
    <path d="M4 20.5h16M13.4 8.6c-.3-.5-.8-.8-1.4-.8-.8 0-1.4.4-1.4 1.1 0 1.5 2.9.8 2.9 2.2 0 .7-.7 1.1-1.5 1.1-.6 0-1.2-.3-1.5-.8M12 6.8v1M12 12.2v1" />
  </svg>
)
export const Exchange = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 10a8 8 0 0 1 13.4-5.2M20 14a8 8 0 0 1-13.4 5.2" />
    <path d="M17.6 2.5v2.6H15M6.4 21.5v-2.6H9" />
    <path d="M13.6 10.3c-.3-.6-.9-.9-1.6-.9-.9 0-1.6.5-1.6 1.2 0 1.7 3.2 1 3.2 2.5 0 .8-.7 1.2-1.6 1.2-.7 0-1.3-.3-1.6-.9" />
  </svg>
)
export const Settings = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
  </svg>
)
export const Menu = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
)
export const Image = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="4" width="18" height="16" rx="2.5" />
    <circle cx="9" cy="10" r="1.8" />
    <path d="m21 16-5-5-9 9" />
  </svg>
)
export const Globe = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3Z" />
  </svg>
)
export const Bitcoin = (p: P) => (
  <svg {...base(p)} strokeWidth={2.2}>
    <path d="M9 6.5h4.2a2.6 2.6 0 0 1 0 5.2H9Zm0 5.2h5a2.9 2.9 0 0 1 0 5.8H9ZM9 6.5v11M11 4.5v2M11 17.5v2M13.5 4.5v2M13.5 17.5v2" />
  </svg>
)
export const Download = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
  </svg>
)
export const Lock = (p: P) => (
  <svg {...base(p)}>
    <rect x="5" y="10.5" width="14" height="10" rx="2" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
  </svg>
)

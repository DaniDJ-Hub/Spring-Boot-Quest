import type { ReactNode, SVGProps } from 'react'

/**
 * Iconos propios en SVG. Rejilla de 24, trazo 1.75, extremos redondeados y
 * `currentColor`: heredan el color del texto y no hay emojis ni glifos Unicode
 * haciendo de icono. Siempre decorativos: el significado lo lleva el texto.
 */
const PATHS = {
  // Navegación
  panel: <><rect x="3.5" y="3.5" width="7" height="9" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="5" rx="1.5" /><rect x="13.5" y="11.5" width="7" height="9" rx="1.5" /><rect x="3.5" y="15.5" width="7" height="5" rx="1.5" /></>,
  graph: <><rect x="9" y="3" width="6" height="4.5" rx="1" /><rect x="3" y="16.5" width="6" height="4.5" rx="1" /><rect x="15" y="16.5" width="6" height="4.5" rx="1" /><path d="M12 7.5V12M6 16.5V12h12v4.5" /></>,
  ticket: <><path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2.5a2.5 2.5 0 0 0 0 5V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2.5a2.5 2.5 0 0 0 0-5Z" /><path d="M9 9.5h6M9 14.5h4" /></>,
  medal: <><circle cx="12" cy="14.5" r="5.5" /><path d="M8.5 10 6 3h4l2 5M15.5 10 18 3h-4l-2 5" /><path d="m12 12 .9 1.8 2 .3-1.45 1.4.35 2L12 16.5l-1.8 1 .35-2L9.1 14.1l2-.3Z" /></>,
  sliders: <><path d="M4 7h9M17 7h3M4 17h3M11 17h9" /><circle cx="15" cy="7" r="2" /><circle cx="9" cy="17" r="2" /></>,

  // Estado
  lock: <><rect x="5" y="10.5" width="14" height="9.5" rx="2" /><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3" /></>,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  x: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  'check-circle': <><circle cx="12" cy="12" r="8.5" /><path d="m8.5 12.3 2.4 2.4 4.8-5" /></>,
  'x-circle': <><circle cx="12" cy="12" r="8.5" /><path d="m9.2 9.2 5.6 5.6M14.8 9.2l-5.6 5.6" /></>,
  alert: <><path d="M10.3 4.3 3 17a2 2 0 0 0 1.7 3h14.6a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z" /><path d="M12 9.5v4M12 16.8v.2" /></>,
  info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8v.2" /></>,
  loader: <path d="M12 3.5a8.5 8.5 0 1 1-8.5 8.5" />,
  dot: <circle cx="12" cy="12" r="3" />,

  // Dirección
  'arrow-left': <path d="M19 12H5m6-6-6 6 6 6" />,
  'arrow-right': <path d="M5 12h14m-6-6 6 6-6 6" />,
  'arrow-up': <path d="M12 19V5m-6 6 6-6 6 6" />,
  'arrow-down': <path d="M12 5v14m6-6-6 6-6-6" />,
  'chevron-down': <path d="m6 9.5 6 6 6-6" />,
  'chevron-up': <path d="m6 14.5 6-6 6 6" />,
  'chevron-right': <path d="m9.5 6 6 6-6 6" />,
  grip: <><circle cx="9" cy="6.5" r=".9" /><circle cx="15" cy="6.5" r=".9" /><circle cx="9" cy="12" r=".9" /><circle cx="15" cy="12" r=".9" /><circle cx="9" cy="17.5" r=".9" /><circle cx="15" cy="17.5" r=".9" /></>,

  // Juego
  play: <path d="M8 5.5v13l10.5-6.5Z" />,
  rocket: <><path d="M12 15.5 8.5 12C10 7 13 4 19.5 4.5 20 11 17 14 12 15.5Z" /><path d="M8.5 12 5 11.5 7.5 8.5h3.2M12 15.5l.5 3.5 3-2.5v-3.2" /><circle cx="15" cy="9" r="1.4" /><path d="M6.5 15.5c-1.5.5-2 2-2 4 2 0 3.5-.5 4-2" /></>,
  flame: <path d="M12 21c-3.9 0-6.5-2.6-6.5-6 0-3.2 2.5-5 3.5-8 1.5 1.3 2.2 2.8 2.3 4.3C12.8 9.5 14 7 13.5 3.5 17 5.5 18.5 10 18.5 15c0 3.4-2.6 6-6.5 6Z" />,
  bolt: <path d="M13 3 5 13.5h6L10.5 21 19 10h-6.2Z" />,
  target: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r=".8" /></>,
  trophy: <><path d="M8 4h8v5a4 4 0 0 1-8 0Z" /><path d="M8 6H4.5c0 3 1.5 4.5 3.7 4.8M16 6h3.5c0 3-1.5 4.5-3.7 4.8M12 13v4M8.5 20h7M10 17h4" /></>,
  flag: <path d="M5.5 21V4m0 1h11l-2 4 2 4h-11" />,
  shield: <path d="M12 3.5 5 6v5.5c0 4.3 2.9 7.8 7 9 4.1-1.2 7-4.7 7-9V6Z" />,
  'shield-check': <><path d="M12 3.5 5 6v5.5c0 4.3 2.9 7.8 7 9 4.1-1.2 7-4.7 7-9V6Z" /><path d="m9 12.2 2.2 2.2 4-4.2" /></>,
  refresh: <><path d="M19.5 12a7.5 7.5 0 0 1-13 5.1M4.5 12a7.5 7.5 0 0 1 13-5.1" /><path d="M17.5 3.5v3.4h-3.4M6.5 20.5v-3.4h3.4" /></>,
  'rotate-ccw': <><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3L4.5 9" /><path d="M4.5 4.5V9H9" /></>,
  repeat: <><path d="M4.5 11V9.5a3 3 0 0 1 3-3h12m-3-3 3 3-3 3" /><path d="M19.5 13v1.5a3 3 0 0 1-3 3h-12m3 3-3-3 3-3" /></>,
  'trending-down': <path d="m3.5 7.5 6.5 6.5 3.5-3.5 7 7M20.5 12.5v5h-5" />,
  sparkle: <path d="M12 3.5c.6 4.3 2.2 5.9 6.5 6.5-4.3.6-5.9 2.2-6.5 6.5-.6-4.3-2.2-5.9-6.5-6.5 4.3-.6 5.9-2.2 6.5-6.5ZM18.5 16c.2 1.4.8 2 2 2.2-1.2.2-1.8.8-2 2.3-.2-1.5-.8-2.1-2-2.3 1.2-.2 1.8-.8 2-2.2Z" />,
  eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.8" /></>,
  'eye-off': <><path d="M3 3l18 18M10.6 5.6A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-2.6 3.4M6.6 6.6C3.9 8.3 2.5 12 2.5 12S6 18.5 12 18.5a9 9 0 0 0 4.4-1.1" /><path d="M9.9 9.9a2.8 2.8 0 0 0 4.2 4.2" /></>,
  hash: <path d="M9.5 3.5 7.5 20.5M16.5 3.5l-2 17M4.5 9h16M3.5 15h16" />,
  hammer: <><path d="m13.5 7.5-9.2 9.2a1.8 1.8 0 0 0 2.5 2.6l9.2-9.3" /><path d="m11.5 5.5 3-2 6 6-2 3-2-2-1.5 1.5-3-3 1.5-1.5Z" /></>,
  lightbulb: <><path d="M9 17.5h6M10 20.5h4" /><path d="M8.2 14.5A6 6 0 1 1 15.8 14.5c-.8.7-1.3 1.6-1.3 2.5V17.5h-5V17c0-.9-.5-1.8-1.3-2.5Z" /></>,
  wrench: <path d="M14.5 6.5a4 4 0 0 1 5.1-2.6l-2.6 2.6.4 2.5 2.5.4 2.6-2.6a4 4 0 0 1-5.4 5L7.6 20.3a2 2 0 0 1-2.9-2.9l8.5-8.5a4 4 0 0 1 1.3-2.4Z" />,
  bug: <><rect x="7.5" y="7.5" width="9" height="12" rx="4.5" /><path d="M9.5 7.5a2.5 2.5 0 0 1 5 0M12 11v8.5M3.5 13.5h4M16.5 13.5h4M4.5 8.5l3 2M19.5 8.5l-3 2M4.5 19l3-2M19.5 19l-3-2" /></>,
  layers: <><path d="m12 3.5 9 4.5-9 4.5L3 8Z" /><path d="m3 12 9 4.5 9-4.5M3 16l9 4.5 9-4.5" /></>,
  fork: <><circle cx="6.5" cy="5.5" r="2" /><circle cx="6.5" cy="18.5" r="2" /><circle cx="17.5" cy="8.5" r="2" /><path d="M6.5 7.5v9M17.5 10.5c0 4-5 3-9.5 6.5" /></>,
  'list-ordered': <><path d="M10 6.5h10M10 12h10M10 17.5h10" /><path d="M4.5 5 6 4v5M4.5 9h3M4.5 14.5c0-1 .7-1.5 1.5-1.5s1.5.5 1.5 1.3c0 1.2-3 2-3 3.7h3" /></>,
  'cursor-text': <><path d="M9 4.5h1.5A1.5 1.5 0 0 1 12 6v12a1.5 1.5 0 0 1-1.5 1.5H9M15 4.5h-1.5A1.5 1.5 0 0 0 12 6v12a1.5 1.5 0 0 0 1.5 1.5H15" /><path d="M9.5 12h5" /></>,
  terminal: <><rect x="3" y="4.5" width="18" height="15" rx="2" /><path d="m7 9.5 3 2.5-3 2.5M12.5 15h4.5" /></>,
  code: <path d="m8.5 7.5-5 4.5 5 4.5M15.5 7.5l5 4.5-5 4.5M13.5 5l-3 14" />,
  file: <><path d="M13.5 3.5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9Z" /><path d="M13.5 3.5V9H19" /></>,
  'file-check': <><path d="M13.5 3.5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9Z" /><path d="M13.5 3.5V9H19M9 14.5l2 2 4-4" /></>,
  database: <><ellipse cx="12" cy="6" rx="7.5" ry="2.5" /><path d="M4.5 6v12c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5V6M4.5 12c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5" /></>,
  box: <><path d="m12 3.5 8 4.5v8L12 20.5 4 16V8Z" /><path d="m4 8 8 4.5L20 8M12 12.5v8" /></>,
  map: <><path d="m9 4.5-5.5 2v13l5.5-2 6 2 5.5-2v-13l-5.5 2Z" /><path d="M9 4.5v13M15 6.5v13" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  copy: <><rect x="8.5" y="8.5" width="11" height="11" rx="2" /><path d="M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2" /></>,
  printer: <><path d="M7 9V3.5h10V9M7 17.5H5a2 2 0 0 1-2-2V11a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4.5a2 2 0 0 1-2 2h-2" /><rect x="7" y="14" width="10" height="6.5" rx="1" /></>,
  volume: <><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4Z" /><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /></>,
  'volume-off': <><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4Z" /><path d="m16 9.5 5 5M21 9.5l-5 5" /></>,
  'git-commit': <><circle cx="12" cy="12" r="3.5" /><path d="M3 12h5.5M15.5 12H21" /></>,
  download: <path d="M12 4v11m-4.5-4.5L12 15l4.5-4.5M4.5 19.5h15" />,
  upload: <path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M4.5 19.5h15" />,
  trash: <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5" />,
} satisfies Record<string, ReactNode>

export type IconName = keyof typeof PATHS

export function Icon({ name, size = 18, className, ...rest }: { name: IconName; size?: number } & Omit<SVGProps<SVGSVGElement>, 'name'>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className ? `shrink-0 ${className}` : 'shrink-0'}
      {...rest}
    >
      {PATHS[name]}
    </svg>
  )
}

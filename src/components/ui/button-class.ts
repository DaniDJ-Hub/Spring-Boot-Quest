import { cx } from './cx'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'boss'
export type ButtonSize = 'sm' | 'md' | 'lg'

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-fg-inverse font-semibold hover:bg-accent-bright',
  secondary: 'border border-edge-strong bg-surface-raised text-fg hover:border-accent hover:text-accent',
  ghost: 'text-fg-secondary hover:bg-surface-overlay hover:text-fg',
  danger: 'border border-danger/70 text-danger hover:bg-danger-dim',
  boss: 'bg-boss text-fg-inverse font-semibold hover:bg-boss-bright',
}

/** 44 px en md: el objetivo táctil recomendado. sm solo en zonas densas de escritorio. */
const SIZE: Record<ButtonSize, string> = {
  sm: 'min-h-[36px] gap-2 px-3 text-caption',
  md: 'min-h-[44px] gap-2 px-4 text-body',
  lg: 'min-h-[48px] gap-2 px-6 text-body',
}

/**
 * Deshabilitado sin opacidad: borde discontinuo y texto terciario, que siguen
 * cumpliendo contraste. Quien deshabilita un botón debería decir por qué cerca.
 */
export const DISABLED_CLASS =
  'disabled:cursor-not-allowed disabled:border disabled:border-dashed disabled:border-edge-strong disabled:bg-transparent disabled:text-fg-tertiary disabled:font-normal'

/** Clases de botón, reutilizables en un enlace que debe verse como botón. */
export function buttonClass({ variant = 'primary', size = 'md', block = false }: { variant?: ButtonVariant; size?: ButtonSize; block?: boolean } = {}) {
  return cx(
    'inline-flex select-none items-center justify-center rounded-md transition-[transform,background-color,border-color,color] duration-fast ease-out active:scale-[.98]',
    VARIANT[variant],
    SIZE[size],
    block && 'w-full',
  )
}

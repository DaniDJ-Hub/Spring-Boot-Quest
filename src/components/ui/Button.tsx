import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from './cx'
import { Icon } from './Icon'
import type { IconName } from './Icon'
import { buttonClass, DISABLED_CLASS } from './button-class'
import type { ButtonSize, ButtonVariant } from './button-class'

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: IconName
  iconRight?: IconName
  /** Mantiene el ancho y anuncia la espera; bloquea nuevas pulsaciones. */
  loading?: boolean
  block?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { children, variant = 'primary', size = 'md', icon, iconRight, loading = false, block = false, className, type = 'button', disabled, ...rest },
  ref,
) {
  const iconSize = size === 'sm' ? 16 : 18
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(buttonClass({ variant, size, block }), DISABLED_CLASS, className)}
      {...rest}
    >
      {loading
        ? <Icon name="loader" size={iconSize} className="animate-spin" />
        : icon && <Icon name={icon} size={iconSize} />}
      {children}
      {iconRight && !loading && <Icon name={iconRight} size={iconSize} />}
    </button>
  )
})

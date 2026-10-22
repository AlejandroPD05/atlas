import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from 'react'
import type { DataQuality } from '../types/domain'
import { cn } from '../utils/cn'
import styles from './ui.module.css'

/* ═══════════════════ Botones ═══════════════════ */

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  icon?: ReactNode
  small?: boolean
  full?: boolean
}

export function Button({
  variant = 'outline',
  icon,
  small,
  full,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(styles.btn, styles[variant], small && styles.btnSmall, full && styles.btnFull, className)}
      {...rest}
    >
      {icon && (
        <span className={styles.btnIcon} aria-hidden="true">
          {icon}
        </span>
      )}
      {children != null && <span className={styles.btnLabel}>{children}</span>}
    </button>
  )
}

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Etiqueta accesible obligatoria (aria-label + tooltip). */
  label: string
  /** Si se define, el botón se comporta como interruptor. */
  active?: boolean
  size?: 'md' | 'lg'
  solid?: boolean
}

export function IconButton({
  label,
  active,
  size = 'md',
  solid = false,
  className,
  children,
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      aria-pressed={typeof active === 'boolean' ? active : undefined}
      className={cn(
        styles.iconBtn,
        size === 'lg' && styles.iconBtnLg,
        solid && styles.iconBtnSolid,
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

/* ═══════════════════ Chips y etiquetas de datos ═══════════════════ */

export type ChipTone = 'neutral' | 'accent' | 'ok' | 'warn' | 'danger' | 'info' | 'unknown'

export interface ChipProps {
  tone?: ChipTone
  dot?: boolean
  title?: string
  className?: string
  children: ReactNode
}

export function Chip({ tone = 'neutral', dot = false, title, className, children }: ChipProps) {
  return (
    <span className={cn(styles.chip, styles[`chip_${tone}`], className)} title={title}>
      {dot && <span className={styles.chipDot} aria-hidden="true" />}
      {children}
    </span>
  )
}

const QUALITY_META: Record<DataQuality, { label: string; tone: ChipTone; title: string }> = {
  real: {
    label: 'OSM · real',
    tone: 'ok',
    title: 'Dato real procedente de OpenStreetMap',
  },
  estimated: {
    label: 'Estimado',
    tone: 'warn',
    title: 'Cálculo estimado a partir de los datos disponibles; no es una medición',
  },
  unknown: {
    label: 'Sin datos',
    tone: 'unknown',
    title: 'Este dato no está disponible en las fuentes configuradas',
  },
  demo: {
    label: 'Demo',
    tone: 'info',
    title: 'Servido por un servicio público de demostración, con límites de uso y sin SLA',
  },
}

/** Etiqueta honesta de la calidad del dato. Nunca se oculta. */
export function DataTag({ quality, className }: { quality: DataQuality; className?: string }) {
  const meta = QUALITY_META[quality]
  return (
    <Chip tone={meta.tone} title={meta.title} className={className}>
      {meta.label}
    </Chip>
  )
}

/* ═══════════════════ Estados ═══════════════════ */

export function Spinner({ size = 16, label = 'Cargando' }: { size?: number; label?: string }) {
  return (
    <span
      className={styles.spinner}
      style={{ width: size, height: size }}
      role="status"
      aria-label={label}
    />
  )
}

export interface EmptyStateProps {
  icon?: ReactNode
  title: string
  hint?: ReactNode
  children?: ReactNode
}

export function EmptyState({ icon, title, hint, children }: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      {icon && (
        <span className={styles.emptyIcon} aria-hidden="true">
          {icon}
        </span>
      )}
      <p className={styles.emptyTitle}>{title}</p>
      {hint && <p className={styles.emptyHint}>{hint}</p>}
      {children}
    </div>
  )
}

/* ═══════════════════ Campos ═══════════════════ */

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode
  trailing?: ReactNode
}

export function Input({ icon, trailing, className, ...rest }: InputProps) {
  return (
    <div className={cn(styles.inputWrap, className)}>
      {icon && (
        <span className={styles.inputIcon} aria-hidden="true">
          {icon}
        </span>
      )}
      <input
        className={cn(
          styles.input,
          Boolean(icon) && styles.inputWithIcon,
          Boolean(trailing) && styles.inputWithTrailing,
        )}
        {...rest}
      />
      {trailing && <span className={styles.inputTrailing}>{trailing}</span>}
    </div>
  )
}

/** Micro-etiqueta técnica en mayúsculas (patrón de la dirección visual). */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn(styles.eyebrow, className)}>{children}</p>
}

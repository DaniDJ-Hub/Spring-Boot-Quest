import { Link } from '../../app/router'
import { WORLDS } from '../../data/worlds'
import { CHALLENGE_META } from '../../data'
import { MASTERY_META, MASTERY_ORDER } from '../../engine/core'
import { buttonClass, cx, Icon, KIND_META, MasteryMeter } from '../../components/ui'
import type { IconName } from '../../components/ui'

const KINDS = Object.entries(KIND_META) as [keyof typeof KIND_META, { label: string; icon: IconName }][]

/**
 * Primera visita. Un panel con todo en cero no dice qué hacer, así que se
 * sustituye por lo único que hace falta saber: cómo funciona y por dónde
 * empezar. Cada idea se enseña con la pieza real, no con un dibujo.
 * Desaparece solo en cuanto hay actividad.
 */
export function Onboarding() {
  return (
    <div className="mx-auto max-w-4xl">
      <p className="text-caption text-fg-secondary">Primera vez por aquí</p>
      <h1 className="mt-2 text-h1">
        Spring Boot se aprende<br />resolviendo, no leyendo
      </h1>
      <p className="mt-4 max-w-xl text-lead leading-relaxed text-fg-secondary">
        {CHALLENGE_META.length} retos repartidos en {WORLDS.length} mundos, sacados del temario de un curso real.
        No hay teoría que leer de antemano: se explica cuando la necesitas, justo después de responder.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <section className="panel p-4">
          <h2 className="mb-1 text-body text-fg">Siete tipos de reto</h2>
          <p className="mb-3 text-caption leading-relaxed text-fg-secondary">
            Corregir código roto, leer un stack trace, ordenar un flujo o decidir como decidirías en el trabajo.
          </p>
          <ul className="space-y-1">
            {KINDS.map(([k, m]) => (
              <li key={k} className="flex items-center gap-2 text-caption text-fg-secondary">
                <Icon name={m.icon} size={14} className="text-fg-tertiary" />
                {m.label}
              </li>
            ))}
          </ul>
        </section>

        <section className="panel p-4">
          <h2 className="mb-1 text-body text-fg">El dominio sube y baja</h2>
          <p className="mb-3 text-caption leading-relaxed text-fg-secondary">
            Un concepto solo se da por dominado con aciertos sostenidos. Un fallo rompe la racha y puede hacerlo bajar.
          </p>
          <ul className="space-y-2">
            {MASTERY_ORDER.map(level => (
              <li key={level} className="flex items-center justify-between gap-2">
                <MasteryMeter level={level} size="sm" />
                <span className={cx('text-caption', MASTERY_META[level].text)}>{MASTERY_META[level].label}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel p-4">
          <h2 className="mb-1 text-body text-fg">El mapa se abre solo</h2>
          <p className="mb-3 text-caption leading-relaxed text-fg-secondary">
            Cada mundo desbloquea los que dependen de él al superar su boss battle, igual que el curso escalona los temas.
          </p>
          <svg viewBox="0 0 120 92" className="w-full" role="img" aria-label="Un mundo superado desbloquea los que dependen de él">
            <rect x="34" y="4" width="52" height="20" rx="4" className="fill-surface-overlay stroke-accent" strokeWidth="1.5" />
            <text x="60" y="18" textAnchor="middle" className="fill-accent font-mono" fontSize={9}>01 ✓</text>
            <path d="M60 24 L60 40 L26 40 L26 56" className="stroke-accent" strokeWidth="1.5" fill="none" />
            <path d="M60 24 L60 40 L94 40 L94 56" className="stroke-accent" strokeWidth="1.5" fill="none" />
            <rect x="4" y="56" width="44" height="20" rx="4" className="fill-surface-raised stroke-edge-strong" strokeWidth="1.5" />
            <text x="26" y="70" textAnchor="middle" className="fill-fg-secondary font-mono" fontSize={9}>02</text>
            <rect x="72" y="56" width="44" height="20" rx="4" className="fill-surface-raised stroke-edge-strong" strokeWidth="1.5" />
            <text x="94" y="70" textAnchor="middle" className="fill-fg-secondary font-mono" fontSize={9}>04</text>
          </svg>
        </section>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link to={{ name: 'mundo', worldId: WORLDS[0].id }} className={buttonClass({ size: 'lg' })}>
          Empezar por {WORLDS[0].title}
          <Icon name="arrow-right" size={18} className="ml-2" />
        </Link>
        <Link to={{ name: 'mapa' }} className={buttonClass({ variant: 'secondary', size: 'lg' })}>
          Ver el mapa completo
        </Link>
      </div>

      <p className="mt-6 flex items-center gap-2 font-mono text-micro text-fg-tertiary">
        <Icon name="info" size={14} />
        El progreso se guarda en este navegador. No hay cuenta ni servidor.
      </p>
    </div>
  )
}

import { Link } from '../../app/router'
import { WORLDS } from '../../data/worlds'
import { CHALLENGE_META } from '../../data'

/**
 * Primera visita. Un panel con todo en cero no dice qué hacer, así que aquí
 * se sustituye por lo único que hace falta saber: cómo funciona y por dónde
 * empezar. Desaparece solo en cuanto hay actividad, sin botón de descartar.
 */
export function Onboarding() {
  return (
    <section className="panel p-6 sm:p-8 max-w-3xl">
      <p className="text-micro text-fg-tertiary mb-2">Primera vez por aquí</p>
      <h1 className="text-h1 mb-3">
        Spring Boot se aprende<br />resolviendo, no leyendo
      </h1>
      <p className="text-body text-fg-secondary leading-relaxed max-w-xl mb-6">
        {CHALLENGE_META.length} retos repartidos en {WORLDS.length} mundos, sacados del temario de un
        curso real. No hay teoría que leer de antemano: se explica cuando la necesitas, justo después
        de responder.
      </p>

      <dl className="grid gap-5 sm:grid-cols-3 mb-7">
        <div>
          <dt className="text-body text-fg mb-1">Siete tipos de reto</dt>
          <dd className="text-caption text-fg-secondary leading-relaxed">
            Corregir código roto, leer un stack trace, ordenar un flujo, decidir como decidirías en el
            trabajo. La opción múltiple es solo una parte.
          </dd>
        </div>
        <div>
          <dt className="text-body text-fg mb-1">Se adapta a tus fallos</dt>
          <dd className="text-caption text-fg-secondary leading-relaxed">
            Lo que fallas vuelve a aparecer. Un concepto solo se da por dominado con aciertos
            sostenidos, y un fallo lo hace bajar.
          </dd>
        </div>
        <div>
          <dt className="text-body text-fg mb-1">El mapa se abre solo</dt>
          <dd className="text-caption text-fg-secondary leading-relaxed">
            Cada mundo desbloquea los que dependen de él al superar su boss battle, igual que el
            curso escalona los temas.
          </dd>
        </div>
      </dl>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          to={{ name: 'mundo', worldId: WORLDS[0].id }}
          className="inline-flex items-center justify-center min-h-[44px] rounded-md bg-accent px-5 text-body font-semibold text-surface-sunken transition-all duration-fast ease-out hover:bg-accent-bright active:scale-[.98]"
        >
          Empezar por {WORLDS[0].title}
        </Link>
        <Link
          to={{ name: 'mapa' }}
          className="inline-flex items-center justify-center min-h-[44px] rounded-md border border-edge-strong px-5 text-body transition-colors duration-fast ease-out hover:border-accent hover:text-accent"
        >
          Ver el mapa completo
        </Link>
      </div>

      <p className="text-micro text-fg-tertiary mt-6">
        El progreso se guarda en este navegador. No hay cuenta ni servidor.
      </p>
    </section>
  )
}

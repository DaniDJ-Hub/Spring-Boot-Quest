/** Definición de rutas y su traducción a direcciones. Sin JSX, para que se
 *  pueda importar desde cualquier sitio sin arrastrar componentes. */
export type Route =
  | { name: 'panel' }
  | { name: 'mapa' }
  | { name: 'mundo'; worldId: string }
  | { name: 'proyectos' }
  | { name: 'logros' }
  | { name: 'refuerzo' }
  | { name: 'examen' }

export function toPath(r: Route): string {
  switch (r.name) {
    case 'panel': return '/'
    case 'mundo': return `/mundo/${r.worldId}`
    default: return `/${r.name}`
  }
}

export function fromPath(path: string): Route {
  const parts = path.replace(/^\/+|\/+$/g, '').split('/')
  switch (parts[0]) {
    case '': return { name: 'panel' }
    case 'mapa': return { name: 'mapa' }
    case 'proyectos': return { name: 'proyectos' }
    case 'logros': return { name: 'logros' }
    case 'refuerzo': return { name: 'refuerzo' }
    case 'examen': return { name: 'examen' }
    case 'mundo': return parts[1] ? { name: 'mundo', worldId: parts[1] } : { name: 'mapa' }
    default: return { name: 'panel' }
  }
}

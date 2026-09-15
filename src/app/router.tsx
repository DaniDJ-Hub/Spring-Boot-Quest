import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { RouterContext, useRouter } from './router-context'
import { fromPath, toPath } from './routes'
import type { Route } from './routes'

/**
 * Router mínimo sobre history.pushState. Cinco rutas no justifican una
 * dependencia externa, y esto da lo que faltaba: enlaces compartibles, botón
 * atrás del navegador y recarga que respeta dónde estabas. El rewrite de
 * vercel.json manda cualquier ruta al index, así que funciona igual en producción.
 */
export function RouterProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>(() =>
    typeof window === 'undefined' ? { name: 'panel' } : fromPath(window.location.pathname),
  )

  useEffect(() => {
    const onPop = () => setRoute(fromPath(window.location.pathname))
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const navigate = useCallback((r: Route, opts?: { replace?: boolean }) => {
    const path = toPath(r)
    if (typeof window !== 'undefined' && window.location.pathname !== path) {
      window.history[opts?.replace ? 'replaceState' : 'pushState']({}, '', path)
    }
    setRoute(r)
  }, [])

  const value = useMemo(() => ({ route, navigate }), [route, navigate])
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
}

type LinkProps = { to: Route; children: ReactNode } &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'children'>

/**
 * Enlace real: es un <a> con href, así que se puede abrir en pestaña nueva,
 * copiar la dirección y anunciar como enlace en un lector de pantalla.
 */
export function Link({ to, children, ...rest }: LinkProps) {
  const { navigate } = useRouter()
  return (
    <a
      href={toPath(to)}
      onClick={e => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
        e.preventDefault()
        navigate(to)
      }}
      {...rest}
    >
      {children}
    </a>
  )
}

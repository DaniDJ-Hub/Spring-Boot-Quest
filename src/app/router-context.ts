import { createContext, useContext } from 'react'
import type { Route } from './routes'

export interface RouterValue {
  route: Route
  navigate: (r: Route, opts?: { replace?: boolean }) => void
}

export const RouterContext = createContext<RouterValue | null>(null)

export function useRouter(): RouterValue {
  const ctx = useContext(RouterContext)
  if (!ctx) throw new Error('useRouter debe usarse dentro de RouterProvider')
  return ctx
}

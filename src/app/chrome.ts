import { createContext, useContext, useEffect } from 'react'

/**
 * Modo inmersivo: mientras se responde una ronda, el shell recoge la barra de
 * navegación inferior para que el reto ocupe la pantalla en móvil.
 */
export const ChromeContext = createContext<{ setImmersive: (v: boolean) => void }>({ setImmersive: () => {} })

export function useImmersive(active: boolean) {
  const { setImmersive } = useContext(ChromeContext)
  useEffect(() => {
    setImmersive(active)
    return () => setImmersive(false)
  }, [active, setImmersive])
}

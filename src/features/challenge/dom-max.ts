import { domMax } from 'motion/react'

/**
 * Proyección de layout de Motion (`layout`), cargada bajo demanda. Solo la
 * piden el reordenamiento de pasos y el grafo del mapa; el resto de la
 * aplicación arranca con domAnimation, más ligero.
 */
export default domMax

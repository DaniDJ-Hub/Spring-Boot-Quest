import { act, useState } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useChallengeSet } from './useChallengeSet'
import { metaOf, resetCache } from '../data'
import type { ChallengeMeta } from '../types'

let root: Root | null = null
let el: HTMLDivElement
const visto: { status: string; ids: string[] }[] = []

function Sonda({ metas }: { metas: ChallengeMeta[] | null }) {
  const set = useChallengeSet(metas)
  visto.push({ status: set.status, ids: set.challenges.map(c => c.id) })
  return <p>{set.status}: {set.challenges.map(c => c.id).join(',')}</p>
}

let cambiar: (m: ChallengeMeta[] | null) => void = () => {}

function Host({ inicial }: { inicial: ChallengeMeta[] | null }) {
  const [metas, setMetas] = useState(inicial)
  cambiar = setMetas
  return <Sonda metas={metas} />
}

/** Un turno del bucle de eventos: lo que tarda en resolverse el import() del mundo. */
const asentar = async () => { await act(async () => { await new Promise(r => setTimeout(r, 50)) }) }

async function montar(inicial: ChallengeMeta[] | null) {
  el = document.createElement('div')
  document.body.appendChild(el)
  root = createRoot(el)
  await act(async () => root!.render(<Host inicial={inicial} />))
  await asentar()
  return el
}

beforeEach(() => { resetCache(); visto.length = 0 })
afterEach(async () => {
  if (root) await act(async () => root!.unmount())
  root = null
  el?.remove()
})

describe('carga de una selección de retos', () => {
  it('descarga el contenido y respeta el orden del motor', async () => {
    const seleccion = [...metaOf('w01')].reverse()
    const dom = await montar(seleccion)
    expect(dom.textContent).toContain('ready')
    expect(visto.at(-1)!.ids).toEqual(seleccion.map(m => m.id))
  })

  it('si el mundo ya está en caché, no vuelve a pasar por «cargando»', async () => {
    await montar(metaOf('w01'))
    await act(async () => root!.unmount())
    visto.length = 0
    el.remove()
    await montar(metaOf('w01'))
    expect(visto.map(v => v.status)).not.toContain('loading')
  })

  it('al cambiar de selección nunca se ve el contenido de la anterior', async () => {
    resetCache()
    await montar(metaOf('w01'))
    const previos = new Set(metaOf('w01').map(m => m.id))
    visto.length = 0
    await act(async () => cambiar(metaOf('w02')))
    await asentar()
    for (const v of visto) {
      // Ni un solo render puede mezclar la ronda vieja con la nueva selección.
      expect(v.ids.some(id => previos.has(id))).toBe(false)
    }
    expect(visto.at(-1)!.ids).toEqual(metaOf('w02').map(m => m.id))
  })

  it('sin selección queda listo y vacío', async () => {
    const dom = await montar(null)
    expect(dom.textContent).toContain('ready')
    expect(visto.at(-1)!.ids).toEqual([])
  })
})

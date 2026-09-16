import { getPrefs } from './prefs'

/**
 * Sonido sintetizado con WebAudio: sin archivos, sin dependencias y sin peso
 * en el bundle. Apagado por defecto; se enciende desde Ajustes. Todas las
 * señales son cortas y graves para que no molesten.
 */
export type Cue = 'correct' | 'wrong' | 'unlock' | 'levelup'

const CUES: Record<Cue, { notes: number[]; gain: number; step: number; type: OscillatorType }> = {
  correct: { notes: [587.33, 880], gain: 0.05, step: 0.08, type: 'triangle' },
  wrong: { notes: [220, 174.61], gain: 0.05, step: 0.09, type: 'sine' },
  unlock: { notes: [523.25, 659.25, 783.99], gain: 0.05, step: 0.1, type: 'triangle' },
  levelup: { notes: [523.25, 659.25, 783.99, 1046.5], gain: 0.05, step: 0.09, type: 'triangle' },
}

let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  // Se crea en la primera reproducción, que siempre nace de una interacción.
  ctx ??= new Ctor()
  return ctx
}

export function playCue(cue: Cue) {
  if (!getPrefs().sound) return
  const ac = audio()
  if (!ac) return
  const { notes, gain, step, type } = CUES[cue]
  const start = ac.currentTime
  notes.forEach((freq, i) => {
    const osc = ac.createOscillator()
    const vol = ac.createGain()
    osc.type = type
    osc.frequency.value = freq
    const t = start + i * step
    vol.gain.setValueAtTime(0.0001, t)
    vol.gain.exponentialRampToValueAtTime(gain, t + 0.01)
    vol.gain.exponentialRampToValueAtTime(0.0001, t + step * 0.9)
    osc.connect(vol).connect(ac.destination)
    osc.start(t)
    osc.stop(t + step)
  })
}

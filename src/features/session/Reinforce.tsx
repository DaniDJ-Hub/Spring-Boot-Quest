import { useMemo, useState } from 'react'
import { CONCEPT_LABEL } from '../../data/worlds'
import { useGameState } from '../../engine/game-context'
import { reinforcementSet, weakConcepts } from '../../engine/core'
import { reinforceRule, weakCount } from '../../engine/selectors'
import { useRouter } from '../../app/router-context'
import { PracticeRound } from './PracticeRound'
import { Button, EmptyState } from '../../components/ui'

/**
 * Sesión de refuerzo: los retos salen de los conceptos donde aciertas menos
 * del umbral del motor. No se elige nada a mano, ni siquiera el tamaño.
 */
export function Reinforce() {
  const { state } = useGameState()
  const { navigate } = useRouter()
  // La selección se fija al entrar: reordenarla mientras respondes sería confuso.
  const [selection, setSelection] = useState(() => reinforcementSet(state))
  const [round, setRound] = useState(0)
  const objetivo = useMemo(() => weakConcepts(state, 4).map(k => CONCEPT_LABEL[k] ?? k), [state])
  const volver = () => navigate({ name: 'panel' })

  if (!selection.length) {
    return (
      <EmptyState
        title="No hay nada que reforzar"
        icon="target"
        body={
          <>
            El refuerzo se arma solo con los conceptos donde aciertas menos del{' '}
            {Math.round(reinforceRule.accuracy * 100)} %, con al menos {reinforceRule.minAttempts} intentos.
            Ahora mismo no hay ninguno.
          </>
        }
        action={<Button onClick={volver}>Volver al panel</Button>}
      />
    )
  }

  return (
    <PracticeRound
      key={round}
      title="Sesión de refuerzo"
      tone="info"
      subtitle={`${selection.length} retos sobre lo que fallas: ${objetivo.join(' · ')}`}
      selection={selection}
      reasons={Object.fromEntries(selection.map(m => [m.id, 'weak' as const]))}
      loadingLabel="Preparando tu sesión de refuerzo"
      onExit={volver}
      summaryTitle="Refuerzo terminado"
      summaryActions={() => (
        <>
          {weakCount(state) > 0 && (
            <Button icon="target" onClick={() => { setSelection(reinforcementSet(state)); setRound(r => r + 1) }}>
              Otra ronda de refuerzo
            </Button>
          )}
          <Button variant="secondary" icon="arrow-left" onClick={volver}>Volver al panel</Button>
        </>
      )}
    />
  )
}

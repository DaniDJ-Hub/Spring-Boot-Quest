/** Sistema de diseño: primitivas compartidas por todas las pantallas. */
export { cx } from './cx'
export { Icon } from './Icon'
export type { IconName } from './Icon'
export { Button } from './Button'
export type { ButtonProps } from './Button'
export { buttonClass } from './button-class'
export type { ButtonSize, ButtonVariant } from './button-class'
export { Badge, Chip, DifficultyPips, KindBadge, RarityBadge, ReasonBadge } from './Badge'
export { Bar, LevelBadge, XpBar } from './Progress'
export { ConceptStreak, MasteryDot, MasteryMeter } from './Mastery'
export { CodeBlock, HighlightedLine } from './CodeBlock'
export type { LineMark } from './CodeBlock'
export { Dialog } from './Dialog'
export { Toasts } from './Toasts'
export { Callout, Empty, EmptyState, Skeleton } from './Feedback'
export { ChallengeCard, WorldCard } from './Cards'
export type { ChallengeRecord } from './Cards'
export { DependencyEdge, GraphNode } from './Graph'
export {
  ACHIEVEMENT_ICON, ACHIEVEMENT_RARITY, achievementIcon, KIND_META, PROJECT_STATUS_META, RARITY_META, rarityOf,
  REASON_META, WORLD_STATUS_META, worldCode,
} from './meta'
export type { Rarity, Tone } from './meta'

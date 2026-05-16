/**
 * PDF Watermark — "Generado con Lyrup" text rendered for free-plan users.
 * Positioned absolute bottom-right, aria-hidden equivalent (no accessible text).
 *
 * ADR-4: watermark is purely `user.plan === 'free'`.
 * The parent (document.tsx) controls rendering; this component is unconditional.
 */

import { Text } from '@react-pdf/renderer'
import { styles } from '../styles'

export function Watermark() {
  return (
    <Text style={styles.watermark}>
      Generado con Lyrup
    </Text>
  )
}

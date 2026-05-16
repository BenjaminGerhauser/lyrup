/**
 * PDF Footer Block — total ARS, validity, optional footer note.
 */

import { View, Text } from '@react-pdf/renderer'
import { styles } from '../styles'
import { formatARS } from '@/lib/format'

interface FooterBlockProps {
  totalArs: number | null
  validityDays: number
  footerNote: string | null
}

export function FooterBlock({ totalArs, validityDays, footerNote }: FooterBlockProps) {
  const total = totalArs ?? 0
  const hasFooterNote = footerNote && footerNote.trim().length > 0

  return (
    <View style={styles.footerSection}>
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalAmount}>
          {totalArs !== null ? formatARS(total) : 'Sin precio calculado'}
        </Text>
      </View>
      <Text style={styles.validityText}>
        Válido por {validityDays} {validityDays === 1 ? 'día' : 'días'}
      </Text>
      {hasFooterNote ? (
        <Text style={styles.footerNote}>{footerNote}</Text>
      ) : null}
    </View>
  )
}

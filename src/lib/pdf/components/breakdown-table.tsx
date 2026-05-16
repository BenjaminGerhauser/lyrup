/**
 * PDF Breakdown Table — per-item cost breakdown sub-table.
 * Only rendered when user.pdf_show_breakdown === true (controlled by parent).
 * Receives the CostBreakdown for a single item.
 */

import { View, Text } from '@react-pdf/renderer'
import { styles } from '../styles'
import { formatARS } from '@/lib/format'
import type { CostBreakdown } from '@/types/calculator'

interface BreakdownTableProps {
  itemDescription: string
  breakdown: CostBreakdown
}

interface BreakdownRow {
  label: string
  value: number
}

export function BreakdownTable({ itemDescription, breakdown }: BreakdownTableProps) {
  const rows: BreakdownRow[] = [
    { label: 'Material', value: breakdown.materialCost },
    { label: 'Electricidad', value: breakdown.electricityCost },
    { label: 'Depreciación', value: breakdown.depreciationCost },
    { label: 'Mano de obra', value: breakdown.laborCost },
    { label: 'Costo total', value: breakdown.totalCost },
  ]

  return (
    <View style={styles.breakdownContainer}>
      <Text style={{ ...styles.breakdownLabel, fontWeight: 700, marginBottom: 4 }}>
        Desglose: {itemDescription}
      </Text>
      {rows.map(({ label, value }) => (
        <View key={label} style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>{label}</Text>
          <Text style={styles.breakdownValue}>{formatARS(value)}</Text>
        </View>
      ))}
    </View>
  )
}

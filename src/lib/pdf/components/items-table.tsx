/**
 * PDF Items Table — one row per QuoteItem.
 * Columns: description, qty, material, printer, hours, filament (g), subtotal ARS.
 */

import { View, Text } from '@react-pdf/renderer'
import { styles } from '../styles'
import { formatARS } from '@/lib/format'
import type { QuoteItem } from '@/types/domain'

interface ItemsTableProps {
  items: QuoteItem[]
}

// Column width percentages (must sum to 100)
const COL = {
  description: '32%',
  qty: '6%',
  material: '14%',
  printer: '14%',
  hours: '9%',
  filament: '9%',
  subtotal: '16%',
} as const

export function ItemsTable({ items }: ItemsTableProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.heading2}>Piezas</Text>

      {/* Header row */}
      <View style={styles.tableHeader}>
        <Text style={{ width: COL.description }}>Descripción</Text>
        <Text style={{ width: COL.qty, textAlign: 'center' }}>Cant.</Text>
        <Text style={{ width: COL.material }}>Material</Text>
        <Text style={{ width: COL.printer }}>Impresora</Text>
        <Text style={{ width: COL.hours, textAlign: 'right' }}>Horas</Text>
        <Text style={{ width: COL.filament, textAlign: 'right' }}>Fil. (g)</Text>
        <Text style={{ width: COL.subtotal, textAlign: 'right' }}>Subtotal</Text>
      </View>

      {/* Data rows */}
      {items.map((item, index) => {
        const isAlt = index % 2 === 1
        const rowStyle = isAlt ? styles.tableRowAlt : styles.tableRow
        return (
          <View key={item.id} style={rowStyle}>
            <Text style={{ width: COL.description, fontSize: 9 }}>
              {item.description || '—'}
            </Text>
            <Text style={{ width: COL.qty, textAlign: 'center', fontSize: 9 }}>
              {item.quantity}
            </Text>
            <Text style={{ width: COL.material, fontSize: 9 }}>
              {item.material?.name ?? '—'}
            </Text>
            <Text style={{ width: COL.printer, fontSize: 9 }}>
              {item.printer?.name ?? '—'}
            </Text>
            <Text style={{ width: COL.hours, textAlign: 'right', fontSize: 9 }}>
              {item.print_hours != null ? item.print_hours.toFixed(1) : '—'}
            </Text>
            <Text style={{ width: COL.filament, textAlign: 'right', fontSize: 9 }}>
              {item.filament_g != null ? item.filament_g.toFixed(0) : '—'}
            </Text>
            <Text style={{ width: COL.subtotal, textAlign: 'right', fontSize: 9, fontWeight: 700 }}>
              {item.subtotal_ars != null ? formatARS(item.subtotal_ars) : '—'}
            </Text>
          </View>
        )
      })}
    </View>
  )
}

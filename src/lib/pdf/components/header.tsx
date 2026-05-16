/**
 * PDF Header — business name banner (text-only, ADR-3).
 * Logo upload is Sprint 4; for Sprint 3 we render business_name as a styled banner.
 */

import { View, Text } from '@react-pdf/renderer'
import { styles } from '../styles'

interface HeaderProps {
  businessName: string | null
}

export function Header({ businessName }: HeaderProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.heading1}>
        {businessName?.trim() || 'Presupuesto'}
      </Text>
      <View style={styles.divider} />
    </View>
  )
}

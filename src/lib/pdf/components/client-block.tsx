/**
 * PDF Client Block — client name and WhatsApp.
 */

import { View, Text } from '@react-pdf/renderer'
import { styles } from '../styles'
import type { Client } from '@/types/domain'

interface ClientBlockProps {
  client: Client | null
}

export function ClientBlock({ client }: ClientBlockProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.heading2}>Cliente</Text>
      {client ? (
        <>
          <Text style={styles.bodyText}>{client.name}</Text>
          {client.whatsapp ? (
            <Text style={styles.label}>WhatsApp: {client.whatsapp}</Text>
          ) : null}
        </>
      ) : (
        <Text style={styles.label}>Sin cliente asignado</Text>
      )}
    </View>
  )
}

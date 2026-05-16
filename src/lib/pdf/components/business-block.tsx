/**
 * PDF Business Block — business contact information.
 */

import { View, Text } from '@react-pdf/renderer'
import { styles } from '../styles'
import type { User } from '@/types/domain'

type BusinessBlockUser = Pick<User, 'phone' | 'business_phone'>

interface BusinessBlockProps {
  user: BusinessBlockUser
}

export function BusinessBlock({ user }: BusinessBlockProps) {
  const hasContact = user.phone || user.business_phone
  if (!hasContact) return null

  return (
    <View style={styles.section}>
      <Text style={styles.heading2}>Contacto</Text>
      {user.business_phone ? (
        <Text style={styles.bodyText}>Tel: {user.business_phone}</Text>
      ) : null}
      {user.phone ? (
        <Text style={styles.bodyText}>WhatsApp: {user.phone}</Text>
      ) : null}
    </View>
  )
}

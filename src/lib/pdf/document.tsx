/**
 * src/lib/pdf/document.tsx
 * Assembles the full Quote PDF document from sub-components.
 *
 * Component order (FR-06):
 *   1. Business banner (Header)
 *   2. Business contact (BusinessBlock)
 *   3. Client block (ClientBlock)
 *   4. Items table (ItemsTable)
 *   5. Breakdown tables — conditional on pdf_show_breakdown (BreakdownTable)
 *   6. Footer block (FooterBlock)
 *   7. Watermark — conditional on plan === 'free' (Watermark)
 */

import { Document, Page } from '@react-pdf/renderer'
import { registerFonts } from './fonts'
import { styles } from './styles'
import { Header } from './components/header'
import { BusinessBlock } from './components/business-block'
import { ClientBlock } from './components/client-block'
import { ItemsTable } from './components/items-table'
import { BreakdownTable } from './components/breakdown-table'
import { FooterBlock } from './components/footer-block'
import { Watermark } from './components/watermark'
import type { QuoteWithItems, Client, User } from '@/types/domain'

// Register fonts once when this module is imported
registerFonts()

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type QuoteDocumentUser = Pick<
  User,
  | 'business_name'
  | 'phone'
  | 'business_phone'
  | 'plan'
  | 'quote_validity_days'
  | 'quote_footer_note'
  | 'pdf_show_breakdown'
>

export interface QuoteDocumentProps {
  quote: QuoteWithItems
  user: QuoteDocumentUser
  client: Client | null
}

// ---------------------------------------------------------------------------
// QuoteDocument
// ---------------------------------------------------------------------------

export function QuoteDocument({ quote, user, client }: QuoteDocumentProps) {
  const isFreePlan = user.plan === 'free'
  const showBreakdown = user.pdf_show_breakdown

  return (
    <Document
      title={`Presupuesto ${quote.id.slice(0, 8)}`}
      author={user.business_name ?? 'Lyrup'}
      subject="Presupuesto de impresión 3D"
    >
      <Page size="A4" style={styles.page}>

        {/* 1. Business banner */}
        <Header businessName={user.business_name} />

        {/* 2. Business contact */}
        <BusinessBlock user={user} />

        {/* 3. Client */}
        <ClientBlock client={client} />

        {/* 4. Items table */}
        <ItemsTable items={quote.items} />

        {/* 5. Cost breakdown sub-tables (per item, conditional) */}
        {showBreakdown
          ? quote.items
              .filter((item) => item.cost_breakdown !== null)
              .map((item) => (
                <BreakdownTable
                  key={item.id}
                  itemDescription={item.description}
                  breakdown={item.cost_breakdown!}
                />
              ))
          : null}

        {/* 6. Footer */}
        <FooterBlock
          totalArs={quote.total_ars}
          validityDays={user.quote_validity_days}
          footerNote={user.quote_footer_note}
        />

        {/* 7. Watermark (free plan only) */}
        {isFreePlan ? <Watermark /> : null}

      </Page>
    </Document>
  )
}

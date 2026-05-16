'use client'

import { FAQ_ITEMS } from '@/lib/constants/faq'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'

export function Faq() {
  return (
    <section id="faq" className="section-gradient py-20 lg:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-lyrup-cyan">
            Preguntas frecuentes
          </p>
          <h2 className="mt-3 font-heading text-3xl font-bold text-lyrup-text-heading sm:text-4xl">
            ¿Tenés dudas?
          </h2>
        </div>

        <Accordion
          className="divide-y divide-lyrup-border rounded-xl border border-lyrup-border bg-lyrup-bg-elevated overflow-hidden"
        >
          {FAQ_ITEMS.map((item) => (
            <AccordionItem
              key={item.question}
              value={item.question}
              className="border-0"
              onOpenChange={(open: boolean) => {
                if (open && typeof window !== 'undefined') {
                  // grandfathered: pre-wrapper inline umami call
                  window.umami?.track('faq_click', { question: item.question })
                }
              }}
            >
              <AccordionTrigger className="px-6 py-4 text-base font-medium text-lyrup-text-heading hover:no-underline hover:text-lyrup-cyan transition-colors [&>svg]:text-lyrup-text-muted">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="px-6">
                <div className="pb-4 text-lyrup-text-secondary leading-relaxed">
                  {item.answer}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}

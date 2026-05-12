import { LandingHeader } from '@/components/landing/header'
import { Hero } from '@/components/landing/hero'
import { Problems } from '@/components/landing/problems'
import { Solution } from '@/components/landing/solution'
import { HowItWorks } from '@/components/landing/how-it-works'
import { Pricing } from '@/components/landing/pricing'
import { SecondCta } from '@/components/landing/second-cta'
import { Faq } from '@/components/landing/faq'
import { Footer } from '@/components/landing/footer'
import { RevealWrapper } from '@/components/landing/reveal-wrapper'

export const revalidate = 60

export default function LandingPage() {
  return (
    <main className="flex flex-col">
      <LandingHeader />
      <Hero />

      <RevealWrapper>
        <Problems />
      </RevealWrapper>

      <RevealWrapper>
        <Solution />
      </RevealWrapper>

      <RevealWrapper>
        <HowItWorks />
      </RevealWrapper>

      <RevealWrapper>
        <Pricing />
      </RevealWrapper>

      <RevealWrapper>
        <SecondCta />
      </RevealWrapper>

      <RevealWrapper>
        <Faq />
      </RevealWrapper>

      <Footer />
    </main>
  )
}

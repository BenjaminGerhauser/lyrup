import { describe, it, expect } from 'vitest'
import { TIERS } from '../pricing'

describe('TIERS pricing constants', () => {
  it('has exactly 3 tiers', () => {
    expect(TIERS).toHaveLength(3)
  })

  it('Free tier has price 0', () => {
    const free = TIERS.find((t) => t.name === 'Free')
    expect(free).toBeDefined()
    expect(free!.price).toBe(0)
  })

  it('Pro tier is highlighted', () => {
    const pro = TIERS.find((t) => t.name === 'Pro')
    expect(pro).toBeDefined()
    expect(pro!.highlighted).toBe(true)
  })

  it('no tier has undefined name or features', () => {
    for (const tier of TIERS) {
      expect(tier.name).toBeDefined()
      expect(tier.name).not.toBe('')
      expect(tier.features).toBeDefined()
      expect(Array.isArray(tier.features)).toBe(true)
    }
  })

  it('all tiers have currency ARS', () => {
    for (const tier of TIERS) {
      expect(tier.currency).toBe('ARS')
    }
  })

  it('Farm has the most features', () => {
    const farm = TIERS.find((t) => t.name === 'Farm')
    expect(farm).toBeDefined()
    const maxFeatures = Math.max(...TIERS.map((t) => t.features.length))
    expect(farm!.features.length).toBe(maxFeatures)
  })
})

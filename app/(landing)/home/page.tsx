export const revalidate = 3600 // revalidate pricing every hour

import { Hero } from '@/components/landing/hero'
import { Story } from '@/components/landing/story'
import { Services } from '@/components/landing/services'
import { HowItWorks } from '@/components/landing/how-it-works'
import { Pricing } from '@/components/landing/pricing'
import { Footer } from '@/components/landing/footer'

export const metadata = {
  title: 'RERU — A Cleaner Community Starts Here',
  description: 'Weekly waste collection, composting, and recycling for Nsasa Estate, Mukono District.',
}

export default function HomePage() {
  return (
    <main>
      <Hero />
      <Story />
      <Services />
      <HowItWorks />
      <Pricing />
      <Footer />
    </main>
  )
}

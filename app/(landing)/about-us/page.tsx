export const dynamic = 'force-static'

import { About } from '@/components/landing/about'

export const metadata = {
  title: 'About Us — RERU Reusable Resources',
  description:
    'Learn about RERU\'s mission to reduce carbon emissions and build a sustainable circular economy through responsible waste collection, composting, and recycling in Mukono District, Uganda.',
}

export default function AboutPage() {
  return <About />
}

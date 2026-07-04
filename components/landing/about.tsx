import Link from 'next/link'
import { Logo } from '@/components/shared/logo'
import { Footer } from '@/components/landing/footer'
import {
  Truck,
  Leaf,
  Users,
  Wrench,
  Filter,
  Smartphone,
  Eye,
  Target,
} from 'lucide-react'

const achievements = [
  {
    icon: Truck,
    text: 'Collect municipal household waste within residential estates in Nsasa Estate',
  },
  {
    icon: Leaf,
    text: 'Reuse biodegradable waste for feeding Black Soldier Flies and earthworms — producing manure and animal feeds',
  },
  {
    icon: Users,
    text: 'Train Nsasa Estate community households on waste sorting and segregation',
  },
  {
    icon: Wrench,
    text: 'Design and custom-build recycling and incineration equipment: PET bottle crusher, bio-degradable chopper, incinerator',
  },
  {
    icon: Filter,
    text: 'Sort and segregate non-biodegradable waste into recyclables (metal, plastic, glass), sanitary waste, and e-waste',
  },
  {
    icon: Smartphone,
    text: 'Design and build a digital solution to facilitate on-site garbage collection tracking',
  },
]

const team = [
  { name: 'Brian Twesigye', role: 'Managing Director' },
  { name: 'Sharifa Nakintu', role: 'Collection and Recycling Sites Officer' },
  { name: 'Jeannie Bianca', role: 'Finance and Administration Officer' },
  { name: 'Justine Namutebi', role: 'Skills and Business Development Lead Trainer' },
  { name: 'Bilali Mugumba', role: 'Equipment and Machine Fabricator' },
]

const advisors = [
  {
    name: 'Irene Wanyana Ssali',
    role: 'MHI Programme Coordinator & PhD Candidate, Karolinska Institute, Sweden',
  },
  {
    name: 'Frederick Mubiru',
    role: 'PhD Student — Public Health',
  },
  {
    name: 'Innocent Mutalya',
    role: 'Mukono District Environmental Officer',
  },
  {
    name: 'Ocaya Nelson Marie',
    role: 'Director, Inclusion and Sustainability — A-Moro Konsults',
  },
  {
    name: 'Phiona Ipali',
    role: 'Director and Secretary',
  },
  {
    name: 'Eng. Andrew Tugume',
    role: 'Engineer — Dott Services',
  },
  {
    name: 'Eng. David Okwi',
    role: 'Electrical and Software Engineer',
  },
]

const videos = [
  {
    id: 'NtzkJOsIg0Y',
    title: 'Brian on the recycling process at the sorting site',
  },
  {
    id: 'wXxsUjNcAHc',
    title: 'Waste handling and organic composting explained',
  },
  {
    id: '_JbcgiigZY0',
    title: 'From collection to compost — the full journey',
  },
  {
    id: 'c5tDCoBV_8M',
    title: 'Community waste sorting and segregation training',
  },
]

export function About() {
  return (
    <main>
      {/* ── Page header ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-green-900 text-white">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/[0.04] pointer-events-none" />
        <div className="absolute bottom-0 -left-20 w-64 h-64 rounded-full bg-white/[0.03] pointer-events-none" />

        <header className="relative z-10 flex items-center justify-between max-w-6xl mx-auto px-6 py-5">
          <Logo size="md" white />
          <nav className="flex items-center gap-3">
            <Link
              href="/home"
              className="px-4 py-2 rounded-md text-base font-semibold text-white/70 hover:text-white transition-colors duration-150"
            >
              Home
            </Link>
            <Link
              href="/auth/login"
              className="px-4 py-2 rounded-md text-base font-semibold text-white/80 hover:text-white transition-colors duration-150"
            >
              Sign in
            </Link>
            <Link
              href="/auth/register"
              className="px-4 py-2 rounded-md text-base font-semibold bg-white text-green-900 hover:bg-green-50 transition-colors duration-150"
            >
              Register
            </Link>
          </nav>
        </header>

        <div className="relative z-10 max-w-6xl mx-auto px-6 pt-14 pb-20 lg:pb-24">
          <span className="reru-overline inline-block px-3 py-1 rounded-full bg-white/10 text-white/80 mb-6">
            Founded 2015 · Nsasa Estate, Mukono
          </span>
          <h1 className="reru-display text-white mb-5 max-w-2xl">
            Waste is a resource. We treat it that way.
          </h1>
          <p className="text-xl text-white/70 leading-relaxed max-w-2xl">
            Reusable Resource exists to reduce carbon emissions and slow down climate change using
            innovative, organic, and technological solutions that make everyday living more
            responsible and sustainable.
          </p>
        </div>
      </section>

      {/* ── Vision & Mission ─────────────────────────────────────── */}
      <section className="py-20 px-6 bg-green-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="reru-overline inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 mb-4">
              Purpose
            </span>
            <h2 className="reru-h2 text-reru-text-primary">Why we exist</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-14">
            <div className="bg-white rounded-xl p-8 border border-reru-border shadow-card">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Eye size={20} className="text-green-700" />
                </div>
                <h3 className="reru-card-title text-reru-text-primary">Vision</h3>
              </div>
              <p className="reru-body text-reru-text-secondary leading-relaxed">
                A clean and fresh environment with waste as a reusable resource.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 border border-reru-border shadow-card">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Target size={20} className="text-green-700" />
                </div>
                <h3 className="reru-card-title text-reru-text-primary">Mission</h3>
              </div>
              <p className="reru-body text-reru-text-secondary leading-relaxed">
                Deploy technology and other climate-environmental smart approaches to waste
                collection, handling, management and recycling that creates a sustainable circular
                economy.
              </p>
            </div>
          </div>

          {/* Slogan callout */}
          <div className="text-center bg-green-900 rounded-2xl px-8 py-12">
            <p className="text-2xl md:text-3xl font-bold text-white leading-snug max-w-2xl mx-auto">
              &ldquo;All waste is useful, no need for landfills&rdquo;
            </p>
            <p className="mt-3 text-white/50 text-sm">RERU slogan</p>
          </div>
        </div>
      </section>

      {/* ── What we've done ──────────────────────────────────────── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="reru-overline inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 mb-4">
              Impact so far
            </span>
            <h2 className="reru-h2 text-reru-text-primary">What we&apos;ve built and done</h2>
            <p className="reru-body text-reru-text-secondary mt-3 max-w-xl mx-auto">
              Since 2015, we have turned ideas into real, measurable results on the ground in Nsasa
              Estate.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {achievements.map(({ icon: Icon, text }, i) => (
              <div
                key={i}
                className="flex gap-4 p-6 rounded-xl border border-reru-border bg-green-50 hover:bg-green-100/60 transition-colors duration-150"
              >
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-card">
                  <Icon size={18} className="text-green-700" />
                </div>
                <p className="reru-body text-reru-text-secondary leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Vision for the future ────────────────────────────────── */}
      <section className="py-20 px-6 bg-green-50">
        <div className="max-w-3xl mx-auto text-center">
          <span className="reru-overline inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 mb-6">
            Where we&apos;re headed
          </span>
          <h2 className="reru-h2 text-reru-text-primary mb-6">Our vision for the future</h2>
          <p className="text-lg text-reru-text-secondary leading-relaxed">
            We want to see communities that sort and separate garbage at home, in schools, and
            workplaces. Collectors picking up the sorted garbage at different times or using
            different trucks. We envision a world where all garbage is handled responsibly — a
            reusable resource, regardless of one&apos;s location.
          </p>
        </div>
      </section>

      {/* ── Videos ───────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="reru-overline inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 mb-4">
              See it in action
            </span>
            <h2 className="reru-h2 text-reru-text-primary">Brian explains the process</h2>
            <p className="reru-body text-reru-text-secondary mt-3 max-w-xl mx-auto">
              Watch our Managing Director walk through waste sorting, composting, and recycling at
              our site.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {videos.map(({ id, title }) => (
              <div key={id} className="rounded-xl overflow-hidden border border-reru-border shadow-card">
                <div className="relative aspect-video">
                  <iframe
                    src={`https://www.youtube.com/embed/${id}`}
                    title={title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
                <p className="px-4 py-3 text-sm text-reru-text-secondary bg-green-50 border-t border-reru-border">
                  {title}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Team ─────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-green-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="reru-overline inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 mb-4">
              The people
            </span>
            <h2 className="reru-h2 text-reru-text-primary">Our team</h2>
            <p className="reru-body text-reru-text-secondary mt-3">
              Founded by Brian Twesigye and Phiona Ipali in 2015.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
            {team.map(({ name, role }) => (
              <div
                key={name}
                className="bg-white rounded-xl p-6 border border-reru-border shadow-card"
              >
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <span className="text-green-700 font-bold text-base">
                    {name.charAt(0)}
                  </span>
                </div>
                <p className="font-semibold text-reru-text-primary text-base">{name}</p>
                <p className="text-sm text-reru-text-secondary mt-1 leading-relaxed">{role}</p>
              </div>
            ))}
          </div>

          {/* Advisory board */}
          <div className="border-t border-reru-border pt-12">
            <h3 className="text-center reru-card-title text-reru-text-primary mb-2">
              Advisory Board
            </h3>
            <p className="text-center text-sm text-reru-text-muted mb-8">
              Experts guiding our strategy across public health, environment, engineering, and
              sustainability.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {advisors.map(({ name, role }) => (
                <div
                  key={name}
                  className="flex items-start gap-3 p-4 rounded-lg border border-reru-border bg-white"
                >
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-700 font-semibold text-xs">
                      {name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-reru-text-primary text-sm">{name}</p>
                    <p className="text-xs text-reru-text-muted mt-0.5 leading-relaxed">{role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}

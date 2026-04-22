import Link from 'next/link'
import { Logo } from '@/components/shared/logo'

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-green-900 text-white">
      {/* Decorative circles */}
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/[0.04] pointer-events-none" />
      <div className="absolute bottom-0 -left-20 w-64 h-64 rounded-full bg-white/[0.03] pointer-events-none" />

      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between max-w-6xl mx-auto px-6 py-5">
        <Logo size="md" white />
        <div className="flex items-center gap-3">
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
        </div>
      </header>

      {/* Hero content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-24">
        <div className="max-w-2xl">
          <span className="reru-overline inline-block px-3 py-1 rounded-full bg-white/10 text-white/80 mb-6">
            Nsasa Estate, Mukono District
          </span>
          <h1 className="reru-display text-white mb-6">
            A Cleaner Community Starts Here.
          </h1>
          <p className="text-xl text-white/70 leading-relaxed mb-8">
            Tired of waste dumped in Nakiyanja River, road sides and empty plots?
            Weekly waste collection, composting, and recycling — starting at UGX 25,000/month.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/auth/register"
              className="inline-flex items-center px-6 py-3 rounded-md text-base font-semibold bg-white text-green-900 hover:bg-green-50 transition-colors duration-150"
            >
              Get started — it&apos;s free to register
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center px-6 py-3 rounded-md text-base font-semibold border border-white/30 text-white hover:bg-white/10 transition-colors duration-150"
            >
              Sign in to your account
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

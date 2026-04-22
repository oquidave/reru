import Link from 'next/link'
import { Logo } from '@/components/shared/logo'
import { Phone, Mail, MapPin } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-green-900 text-white py-14 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row gap-10 justify-between mb-10">
          <div className="max-w-xs">
            <Logo size="md" white className="mb-4" />
            <p className="text-sm text-white/60 leading-relaxed">
              Household waste collection and recycling for Nsasa Estate, Mukono District.
              Part of Mukono Countryside Mixed Farm Ltd.
            </p>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-semibold text-white/40 uppercase tracking-wider">Contact</p>
            <a href="tel:+256778527802" className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
              <Phone size={14} /> 0778 527 802 (MTN MoMo)
            </a>
            <a href="tel:+256704132691" className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
              <Phone size={14} /> 0704 132 691 (Airtel)
            </a>
            <a href="mailto:info@reru.ug" className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
              <Mail size={14} /> info@reru.ug
            </a>
            <p className="flex items-center gap-2 text-sm text-white/70">
              <MapPin size={14} /> Nsasa Estate, Mukono District
            </p>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-semibold text-white/40 uppercase tracking-wider">Get started</p>
            <Link href="/auth/register" className="block text-sm text-white/70 hover:text-white transition-colors">Register</Link>
            <Link href="/auth/login" className="block text-sm text-white/70 hover:text-white transition-colors">Sign in</Link>
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/40">© 2026 Mukono Countryside Mixed Farm Ltd. All rights reserved.</p>
          <Link
            href="/auth/register"
            className="px-4 py-2 rounded-md text-sm font-semibold bg-green-700 hover:bg-green-600 text-white transition-colors duration-150"
          >
            Register today
          </Link>
        </div>
      </div>
    </footer>
  )
}

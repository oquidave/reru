import Link from 'next/link'
import { Check } from 'lucide-react'
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server'
import { formatUGX } from '@/lib/utils'
import type { PricingTier } from '@/types'

function periodLabel(tier: PricingTier): string {
  if (tier.billing_period === 'month') return 'per month'
  if (tier.billing_period === 'year') return 'per year'
  return 'custom arrangement'
}

const FEATURES = [
  'Weekly waste collection',
  'Bag delivery',
  'Online tracking',
  'Invoice history',
]

export async function Pricing() {
  const supabase = createSupabaseServiceRoleClient()
  const { data: tiers } = await supabase
    .from('pricing_tiers')
    .select('*')
    .eq('is_public', true)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  const plans = (tiers ?? []) as PricingTier[]

  return (
    <section className="py-20 px-6 max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <span className="reru-overline inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 mb-4">
          Pricing
        </span>
        <h2 className="reru-h2 text-reru-text-primary">Simple, honest pricing</h2>
        <p className="reru-body text-reru-text-secondary mt-3">
          Payment via MTN MoMo, Airtel Money, Bank of Africa, or cash.
        </p>
      </div>

      {plans.length === 0 ? (
        <p className="text-center text-reru-text-muted">Pricing information coming soon.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 justify-center max-w-5xl mx-auto">
          {plans.map((tier, idx) => {
            const highlight = tier.billing_period === 'year' && tier.price !== null && tier.price >= 200000
            return (
              <div
                key={tier.id}
                className={`relative flex flex-col rounded-2xl border-[1.5px] p-6 ${
                  highlight
                    ? 'border-green-700 shadow-card-raised'
                    : 'border-reru-border shadow-card bg-white'
                }`}
                style={highlight ? { background: 'linear-gradient(135deg, var(--color-green-900), var(--color-green-700))' } : {}}
              >
                {highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full bg-reru-accent text-white reru-overline whitespace-nowrap">
                    Best Value
                  </span>
                )}
                <p className={`text-lg font-bold mb-1 ${highlight ? 'text-white' : 'text-reru-text-primary'}`}>
                  {tier.name}
                </p>
                {tier.price !== null ? (
                  <>
                    <p className={`text-4xl font-extrabold mb-0.5 ${highlight ? 'text-white' : 'text-reru-text-primary'}`}>
                      {formatUGX(tier.price)}
                    </p>
                    <p className={`text-sm mb-3 ${highlight ? 'text-white/60' : 'text-reru-text-muted'}`}>
                      {periodLabel(tier)}
                    </p>
                  </>
                ) : (
                  <p className={`text-lg font-semibold mb-3 ${highlight ? 'text-white/80' : 'text-reru-text-secondary'}`}>
                    Contact us
                  </p>
                )}
                {tier.description && (
                  <p className={`text-sm mb-5 leading-relaxed ${highlight ? 'text-white/70' : 'text-reru-text-secondary'}`}>
                    {tier.description}
                  </p>
                )}
                <ul className="space-y-2 mb-6 flex-1">
                  {FEATURES.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Check size={13} strokeWidth={2.5} className={highlight ? 'text-green-200' : 'text-green-700'} />
                      <span className={`text-sm ${highlight ? 'text-white/80' : 'text-reru-text-secondary'}`}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/register"
                  className={`block text-center py-2.5 rounded-md text-sm font-semibold transition-colors duration-150 ${
                    highlight
                      ? 'bg-white text-green-900 hover:bg-green-50'
                      : 'bg-green-700 text-white hover:bg-green-600'
                  }`}
                >
                  Get started
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

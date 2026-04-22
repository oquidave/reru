import Link from 'next/link'
import { Check } from 'lucide-react'

const plans = [
  {
    name: 'Monthly',
    price: 'UGX 25,000',
    period: 'per month',
    note: 'Flexible. Cancel anytime with 3 months notice.',
    features: ['Weekly waste collection', 'Bag delivery', 'Online tracking', 'Invoice history'],
    tag: null,
    cta: 'Start monthly',
    highlight: false,
  },
  {
    name: 'Annual',
    price: 'UGX 240,000',
    period: 'per year',
    note: 'Saves you UGX 60,000 compared to monthly billing.',
    features: ['Weekly waste collection', 'Bag delivery', 'Online tracking', 'Invoice history', 'Priority support'],
    tag: 'Best Value',
    cta: 'Start annual',
    highlight: true,
  },
]

export function Pricing() {
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
      <div className="flex flex-col sm:flex-row gap-6 justify-center max-w-2xl mx-auto">
        {plans.map(plan => (
          <div
            key={plan.name}
            className={`relative flex-1 rounded-2xl border-[1.5px] p-8 ${plan.highlight ? 'border-green-700 shadow-card-raised' : 'border-reru-border shadow-card bg-white'}`}
            style={plan.highlight ? { background: 'linear-gradient(135deg, var(--color-green-900), var(--color-green-700))' } : {}}
          >
            {plan.tag && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full bg-reru-accent text-white reru-overline whitespace-nowrap">
                {plan.tag}
              </span>
            )}
            <p className={`text-lg font-bold mb-1 ${plan.highlight ? 'text-white' : 'text-reru-text-primary'}`}>{plan.name}</p>
            <p className={`text-5xl font-extrabold mb-1 ${plan.highlight ? 'text-white' : 'text-reru-text-primary'}`}>{plan.price}</p>
            <p className={`text-sm mb-4 ${plan.highlight ? 'text-white/60' : 'text-reru-text-muted'}`}>{plan.period}</p>
            <p className={`text-sm mb-6 leading-relaxed ${plan.highlight ? 'text-white/70' : 'text-reru-text-secondary'}`}>{plan.note}</p>
            <ul className="space-y-2 mb-8">
              {plan.features.map(f => (
                <li key={f} className="flex items-center gap-2">
                  <Check size={14} strokeWidth={2.5} className={plan.highlight ? 'text-green-200' : 'text-green-700'} />
                  <span className={`text-sm ${plan.highlight ? 'text-white/80' : 'text-reru-text-secondary'}`}>{f}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/auth/register"
              className={`block text-center py-3 rounded-md text-base font-semibold transition-colors duration-150 ${
                plan.highlight
                  ? 'bg-white text-green-900 hover:bg-green-50'
                  : 'bg-green-700 text-white hover:bg-green-600'
              }`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}

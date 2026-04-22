import { Truck, ShieldCheck, CreditCard, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { StatusBadge } from '@/components/shared/status-badge'
import type { Client } from '@/types'

interface StatsCardsProps {
  client: Client
}

export function StatsCards({ client }: StatsCardsProps) {
  const stats = [
    {
      icon: Truck,
      label: 'Plan',
      value: client.plan === 'annual' ? 'Annual' : 'Monthly',
    },
    {
      icon: ShieldCheck,
      label: 'Status',
      value: null,
      badge: client.status,
    },
    {
      icon: CreditCard,
      label: 'Paid through',
      value: client.paid_through ? formatDate(client.paid_through) : '—',
    },
    {
      icon: Calendar,
      label: 'Collection day',
      value: client.collection_day,
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map(({ icon: Icon, label, value, badge }) => (
        <div
          key={label}
          className="bg-white border border-reru-border rounded-xl p-5 shadow-card"
        >
          <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center mb-3">
            <Icon size={17} strokeWidth={1.8} className="text-green-600" />
          </div>
          <p className="reru-overline text-reru-text-muted mb-1">{label}</p>
          {badge ? (
            <StatusBadge status={badge} />
          ) : (
            <p className="reru-card-title text-reru-text-primary">{value}</p>
          )}
        </div>
      ))}
    </div>
  )
}

import { Users, UserCheck, UserX, Receipt, Clock, AlertTriangle, Truck, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCard {
  label: string
  value: number
  icon: React.ElementType
  iconColor: string
  iconBg: string
}

interface AdminStatsGridProps {
  totalClients: number
  activeClients: number
  suspendedClients: number
  paidInvoices: number
  pendingInvoices: number
  overdueInvoices: number
  collectionsToday: number
  completedToday: number
}

export function AdminStatsGrid({
  totalClients,
  activeClients,
  suspendedClients,
  paidInvoices,
  pendingInvoices,
  overdueInvoices,
  collectionsToday,
  completedToday,
}: AdminStatsGridProps) {
  const stats: StatCard[] = [
    { label: 'Total clients',      value: totalClients,      icon: Users,        iconColor: 'text-green-700', iconBg: 'bg-green-100' },
    { label: 'Active clients',     value: activeClients,     icon: UserCheck,    iconColor: 'text-green-700', iconBg: 'bg-green-100' },
    { label: 'Suspended',          value: suspendedClients,  icon: UserX,        iconColor: 'text-reru-danger', iconBg: 'bg-red-100' },
    { label: 'Invoices paid',      value: paidInvoices,      icon: Receipt,      iconColor: 'text-green-700', iconBg: 'bg-green-100' },
    { label: 'Invoices pending',   value: pendingInvoices,   icon: Clock,        iconColor: 'text-reru-warning', iconBg: 'bg-orange-100' },
    { label: 'Invoices overdue',   value: overdueInvoices,   icon: AlertTriangle, iconColor: 'text-reru-danger', iconBg: 'bg-red-100' },
    { label: 'Collections today',  value: collectionsToday,  icon: Truck,        iconColor: 'text-blue-600', iconBg: 'bg-blue-100' },
    { label: 'Completed today',    value: completedToday,    icon: CheckCircle2, iconColor: 'text-green-700', iconBg: 'bg-green-100' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
      {stats.map(({ label, value, icon: Icon, iconColor, iconBg }) => (
        <div
          key={label}
          className="bg-white border border-reru-border rounded-xl p-5 shadow-card"
        >
          <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center mb-3', iconBg)}>
            <Icon size={17} strokeWidth={1.8} className={iconColor} />
          </div>
          <p className="text-3xl font-extrabold text-reru-text-primary">{value}</p>
          <p className="reru-overline text-reru-text-muted mt-1">{label.toUpperCase()}</p>
        </div>
      ))}
    </div>
  )
}

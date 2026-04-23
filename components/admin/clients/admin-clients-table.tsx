import Link from 'next/link'
import { ChevronRight, Users } from 'lucide-react'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatDate } from '@/lib/utils'
import type { Client } from '@/types'

interface AdminClientsTableProps {
  clients: Client[]
}

export function AdminClientsTable({ clients }: AdminClientsTableProps) {
  if (clients.length === 0) {
    return (
      <div className="bg-white border border-reru-border rounded-xl shadow-card p-12 text-center">
        <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mx-auto mb-4">
          <Users size={20} strokeWidth={1.8} className="text-green-700" />
        </div>
        <p className="reru-card-title text-reru-text-primary mb-1">No clients found</p>
        <p className="reru-body text-reru-text-secondary">Try adjusting your search or filters.</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-reru-border rounded-xl shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-reru-border">
              <th className="px-6 py-3 text-left reru-overline text-reru-text-muted">Name</th>
              <th className="px-6 py-3 text-left reru-overline text-reru-text-muted">Zone</th>
              <th className="px-6 py-3 text-left reru-overline text-reru-text-muted">Plan</th>
              <th className="px-6 py-3 text-left reru-overline text-reru-text-muted">Status</th>
              <th className="px-6 py-3 text-left reru-overline text-reru-text-muted">Paid through</th>
              <th className="px-6 py-3 text-left reru-overline text-reru-text-muted">Collection day</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody>
            {clients.map((client, i) => (
              <tr
                key={client.id}
                className={`hover:bg-green-50 transition-colors duration-150 ${i < clients.length - 1 ? 'border-b border-reru-border' : ''}`}
              >
                <td className="px-6 py-4">
                  <p className="text-md font-semibold text-reru-text-primary">{client.name}</p>
                  <p className="text-sm text-reru-text-muted">{client.phone}</p>
                </td>
                <td className="px-6 py-4 text-md text-reru-text-secondary">{client.zone}</td>
                <td className="px-6 py-4 text-md text-reru-text-secondary capitalize">{client.plan}</td>
                <td className="px-6 py-4"><StatusBadge status={client.status} /></td>
                <td className="px-6 py-4 text-md text-reru-text-secondary whitespace-nowrap">
                  {client.paid_through ? formatDate(client.paid_through) : '—'}
                </td>
                <td className="px-6 py-4 text-md text-reru-text-secondary">{client.collection_day}</td>
                <td className="px-6 py-4 text-right">
                  <Link
                    href={`/dashboard/admin/clients/${client.id}`}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-green-700 hover:text-green-600 transition-colors"
                  >
                    View <ChevronRight size={14} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

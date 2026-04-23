import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatDate, formatUGX } from '@/lib/utils'
import type { Invoice } from '@/types'

type OverdueRow = Invoice & { client_name: string; client_id: string }

interface AdminOverdueTableProps {
  invoices: OverdueRow[]
}

export function AdminOverdueTable({ invoices }: AdminOverdueTableProps) {
  if (invoices.length === 0) {
    return (
      <div className="bg-white border border-reru-border rounded-xl shadow-card p-8 text-center">
        <p className="reru-body text-reru-text-secondary">No overdue invoices. All accounts are in good standing.</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-reru-border rounded-xl shadow-card overflow-hidden">
      <div className="px-6 py-4 border-b border-reru-border">
        <h2 className="reru-card-title text-reru-text-primary">Overdue invoices</h2>
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-reru-border">
            <th className="px-6 py-3 text-left reru-overline text-reru-text-muted">Client</th>
            <th className="px-6 py-3 text-left reru-overline text-reru-text-muted">Date</th>
            <th className="px-6 py-3 text-right reru-overline text-reru-text-muted">Total</th>
            <th className="px-6 py-3 text-right reru-overline text-reru-text-muted">Status</th>
            <th className="px-6 py-3" />
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv, i) => (
            <tr
              key={inv.id}
              className={`hover:bg-green-50 transition-colors duration-150 ${i < invoices.length - 1 ? 'border-b border-reru-border' : ''}`}
            >
              <td className="px-6 py-4 text-md font-semibold text-reru-text-primary">{inv.client_name}</td>
              <td className="px-6 py-4 text-md text-reru-text-secondary whitespace-nowrap">{formatDate(inv.date)}</td>
              <td className="px-6 py-4 text-md font-semibold text-reru-text-primary text-right">{formatUGX(inv.total)}</td>
              <td className="px-6 py-4 text-right"><StatusBadge status={inv.status} /></td>
              <td className="px-6 py-4 text-right">
                <Link
                  href={`/dashboard/admin/clients/${inv.client_id}`}
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
  )
}

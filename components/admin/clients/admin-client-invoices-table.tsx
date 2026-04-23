import { FileText } from 'lucide-react'
import { StatusBadge } from '@/components/shared/status-badge'
import { AdminMarkPaidDialog } from '@/components/admin/invoices/admin-mark-paid-dialog'
import { formatDate, formatUGX } from '@/lib/utils'
import type { Invoice } from '@/types'

interface AdminClientInvoicesTableProps {
  invoices: Invoice[]
  clientId: string
}

export function AdminClientInvoicesTable({ invoices }: AdminClientInvoicesTableProps) {
  if (invoices.length === 0) {
    return (
      <div className="bg-white border border-reru-border rounded-xl shadow-card p-8 text-center">
        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mx-auto mb-3">
          <FileText size={18} strokeWidth={1.8} className="text-green-700" />
        </div>
        <p className="reru-body text-reru-text-secondary">No invoices for this client yet.</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-reru-border rounded-xl shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-reru-border">
              <th className="px-6 py-3 text-left reru-overline text-reru-text-muted">Date</th>
              <th className="px-6 py-3 text-left reru-overline text-reru-text-muted">Plan</th>
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
                <td className="px-6 py-4 text-md text-reru-text-secondary whitespace-nowrap">{formatDate(inv.date)}</td>
                <td className="px-6 py-4 text-md text-reru-text-secondary capitalize">{inv.plan}</td>
                <td className="px-6 py-4 text-md font-semibold text-reru-text-primary text-right">{formatUGX(inv.total)}</td>
                <td className="px-6 py-4 text-right"><StatusBadge status={inv.status} /></td>
                <td className="px-6 py-4 text-right">
                  {inv.status !== 'paid' && <AdminMarkPaidDialog invoice={inv} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

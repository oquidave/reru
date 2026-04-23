import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatDate, formatUGX } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'
import type { Invoice } from '@/types'

export const metadata = { title: 'Invoices — RERU' }

export default async function InvoicesPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: clientRow } = await supabase
    .from('reru_clients')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!clientRow) redirect('/auth/login')

  const { data: invoices } = await supabase
    .from('reru_invoices')
    .select('*')
    .eq('client_id', clientRow.id)
    .order('date', { ascending: false })

  const typed = (invoices ?? []) as Invoice[]

  return (
    <div>
      <h1 className="reru-h1 text-reru-text-primary mb-2">Invoices</h1>
      <p className="reru-body text-reru-text-secondary mb-8">Your billing and payment history.</p>

      <div className="bg-white border border-reru-border rounded-xl shadow-card overflow-hidden">
        {typed.length === 0 ? (
          <p className="px-6 py-12 text-center reru-body text-reru-text-muted">No invoices yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-reru-border">
                  <th className="px-6 py-3 text-left reru-overline text-reru-text-muted">Invoice</th>
                  <th className="px-6 py-3 text-left reru-overline text-reru-text-muted">Date</th>
                  <th className="px-6 py-3 text-left reru-overline text-reru-text-muted">Plan</th>
                  <th className="px-6 py-3 text-right reru-overline text-reru-text-muted">Total</th>
                  <th className="px-6 py-3 text-right reru-overline text-reru-text-muted">Status</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody>
                {typed.map((inv, i) => (
                  <tr
                    key={inv.id}
                    className={`hover:bg-green-50 transition-colors duration-150 ${i < typed.length - 1 ? 'border-b border-reru-border' : ''}`}
                  >
                    <td className="px-6 py-4 text-md font-semibold text-reru-text-primary">{inv.id}</td>
                    <td className="px-6 py-4 text-md text-reru-text-secondary whitespace-nowrap">{formatDate(inv.date)}</td>
                    <td className="px-6 py-4 text-md text-reru-text-secondary capitalize">{inv.plan}</td>
                    <td className="px-6 py-4 text-md font-semibold text-reru-text-primary text-right">{formatUGX(inv.total)}</td>
                    <td className="px-6 py-4 text-right"><StatusBadge status={inv.status} /></td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/dashboard/invoices/${inv.id}`}
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
        )}
      </div>
    </div>
  )
}

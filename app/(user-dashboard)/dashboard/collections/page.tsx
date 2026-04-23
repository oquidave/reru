import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatDate } from '@/lib/utils'
import { CheckCircle, Clock, AlertCircle } from 'lucide-react'
import type { Collection } from '@/types'

export const metadata = { title: 'Collections — RERU' }

export default async function CollectionsPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: clientRow } = await supabase
    .from('reru_clients')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!clientRow) redirect('/auth/login')

  const { data: collections } = await supabase
    .from('reru_collections')
    .select('*')
    .eq('client_id', clientRow.id)
    .order('scheduled_date', { ascending: false })

  const typed = (collections ?? []) as Collection[]
  const completed = typed.filter(c => c.status === 'completed').length
  const scheduled = typed.filter(c => c.status === 'scheduled').length
  const missed = typed.filter(c => c.status === 'missed').length

  const summary = [
    { icon: CheckCircle, label: 'Completed', count: completed, color: 'text-green-700', bg: 'bg-green-100' },
    { icon: Clock,       label: 'Scheduled', count: scheduled, color: 'text-blue-600',  bg: 'bg-blue-100' },
    { icon: AlertCircle, label: 'Missed',    count: missed,    color: 'text-reru-danger', bg: 'bg-red-100' },
  ]

  return (
    <div>
      <h1 className="reru-h1 text-reru-text-primary mb-2">Collections</h1>
      <p className="reru-body text-reru-text-secondary mb-8">Your full waste collection history.</p>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {summary.map(({ icon: Icon, label, count, color, bg }) => (
          <div key={label} className="bg-white border border-reru-border rounded-xl p-5 shadow-card text-center">
            <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center mx-auto mb-3`}>
              <Icon size={18} strokeWidth={1.8} className={color} />
            </div>
            <p className="text-3xl font-extrabold text-reru-text-primary">{count}</p>
            <p className="reru-overline text-reru-text-muted mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Log */}
      <div className="bg-white border border-reru-border rounded-xl shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-reru-border">
          <h2 className="reru-card-title text-reru-text-primary">Collection log</h2>
        </div>
        {typed.length === 0 ? (
          <p className="px-6 py-12 text-center reru-body text-reru-text-muted">No collections recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-reru-border">
                  <th className="px-6 py-3 text-left reru-overline text-reru-text-muted">Date</th>
                  <th className="px-6 py-3 text-left reru-overline text-reru-text-muted">Notes</th>
                  <th className="px-6 py-3 text-right reru-overline text-reru-text-muted">Status</th>
                </tr>
              </thead>
              <tbody>
                {typed.map((c, i) => (
                  <tr
                    key={c.id}
                    className={`hover:bg-green-50 transition-colors duration-150 ${i < typed.length - 1 ? 'border-b border-reru-border' : ''}`}
                  >
                    <td className="px-6 py-4 text-md font-semibold text-reru-text-primary whitespace-nowrap">
                      {formatDate(c.scheduled_date)}
                    </td>
                    <td className="px-6 py-4 text-md text-reru-text-secondary">
                      {c.notes ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <StatusBadge status={c.status} />
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

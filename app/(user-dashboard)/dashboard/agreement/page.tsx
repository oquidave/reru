import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Logo } from '@/components/shared/logo'
import { StatusBadge } from '@/components/shared/status-badge'
import { PrintButton } from '@/components/shared/print-button'
import type { Client } from '@/types'

export const metadata = { title: 'Service Agreement — RERU' }

const SECTIONS = [
  {
    title: '1. Scope of services',
    content: `RERU (Mukono Countryside Mixed Farm Ltd) agrees to provide weekly household waste collection services to the Client at the address specified during registration. Services include kerbside collection of organic, plastic, glass, and paper waste; transportation to sorting and composting facilities; and responsible disposal of non-recyclable waste at licensed facilities in Mukono District.`,
  },
  {
    title: '2. Collection schedule and equipment',
    content: `Collections occur once per week on the Client's preferred weekday as selected during registration. The Client must place labelled waste bags at their gate by 8:00 AM on the scheduled day. RERU will supply colour-coded bags for sorting: black (organic), yellow (plastic/glass), blue (paper). Missed collections due to Client non-compliance (bags not placed) will be recorded but not rescheduled.`,
  },
  {
    title: '3. Fees and payment terms',
    content: `Service fees are UGX 25,000 per month (Monthly plan) or UGX 240,000 per year (Annual plan). Payment is due by the 10th of each billing month. Accepted payment methods: MTN Mobile Money (0778 527 802), Airtel Money (0704 132 691), Bank of Africa (A/C 06566780001), or cash in person. A 6% tax is applied to all invoices. Service will be suspended after three (3) consecutive months of non-payment. Overdue balances must be settled in full before service resumes.`,
  },
  {
    title: '4. Obligations of the parties',
    content: `RERU agrees to: maintain a reliable and consistent collection schedule; notify clients of any changes to collection days with at least 48 hours notice; handle all waste in an environmentally responsible manner; provide invoices and collection records via this platform.\n\nThe Client agrees to: sort waste into the correct bags as instructed; place bags at the gate by 8:00 AM on the scheduled day; pay invoices by the due date; notify RERU of address changes or service concerns promptly; not place hazardous, medical, or illegal waste for collection.`,
  },
  {
    title: '5. Duration and termination',
    content: `This agreement begins on the date of registration and continues for a minimum of five (5) years, renewable by mutual consent. Either party may terminate the agreement with three (3) months written notice. RERU may terminate immediately in cases of repeated non-payment, persistent non-compliance with waste sorting guidelines, or abusive conduct toward RERU staff. No refund is issued for unused periods of a prepaid Annual plan upon early termination by the Client.`,
  },
  {
    title: '6. Governing law',
    content: `This agreement is governed by the laws of the Republic of Uganda. Any disputes shall first be resolved through mutual negotiation. If no resolution is reached within 30 days, disputes shall be referred to arbitration in Mukono District under the Arbitration and Conciliation Act, Cap. 4 of the Laws of Uganda.`,
  },
]

export default async function AgreementPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: client } = await supabase
    .from('reru_clients')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!client) redirect('/auth/login')

  const typedClient = client as Client

  return (
    <div className="max-w-[700px] mx-auto">
      {/* Header */}
      <div className="bg-white border border-reru-border rounded-xl shadow-card p-8 mb-6">
        <div className="flex items-start justify-between mb-6">
          <Logo size="md" />
          <StatusBadge status="active" label="Active agreement" />
        </div>
        <h1 className="reru-h1 text-reru-text-primary mb-1">Service Agreement</h1>
        <p className="reru-body text-reru-text-secondary">
          Household Waste Collection — Nsasa Estate, Mukono District
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-reru-text-muted">Client</p>
            <p className="font-semibold text-reru-text-primary">{typedClient.name}</p>
          </div>
          <div>
            <p className="text-reru-text-muted">Zone</p>
            <p className="font-semibold text-reru-text-primary">{typedClient.zone}</p>
          </div>
          <div>
            <p className="text-reru-text-muted">Plan</p>
            <p className="font-semibold text-reru-text-primary capitalize">{typedClient.plan}</p>
          </div>
          <div>
            <p className="text-reru-text-muted">Collection day</p>
            <p className="font-semibold text-reru-text-primary">{typedClient.collection_day}</p>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="bg-white border border-reru-border rounded-xl shadow-card overflow-hidden mb-6">
        {SECTIONS.map((section, i) => (
          <div key={section.title} className={`p-6 ${i < SECTIONS.length - 1 ? 'border-b border-reru-border' : ''}`}>
            <h2 className="text-lg font-bold text-reru-text-primary mb-3">{section.title}</h2>
            {section.content.split('\n\n').map((para, j) => (
              <p key={j} className="reru-body text-reru-text-secondary mb-3 last:mb-0">{para}</p>
            ))}
          </div>
        ))}
      </div>

      {/* Signatures */}
      <div className="bg-white border border-reru-border rounded-xl shadow-card p-8 mb-6">
        <h2 className="reru-card-title text-reru-text-primary mb-6">Signatures</h2>
        <div className="grid grid-cols-2 gap-10">
          <div>
            <p className="reru-label text-reru-text-secondary mb-8">Service provider</p>
            <div className="border-t border-reru-border pt-3">
              <p className="text-md font-semibold text-reru-text-primary">Mukono Countryside Mixed Farm Ltd</p>
              <p className="text-sm text-reru-text-muted">Authorised signatory</p>
            </div>
          </div>
          <div>
            <p className="reru-label text-reru-text-secondary mb-8">Client</p>
            <div className="border-t border-reru-border pt-3">
              <p className="text-md font-semibold text-reru-text-primary">{typedClient.name}</p>
              <p className="text-sm text-reru-text-muted">{typedClient.address}</p>
            </div>
          </div>
        </div>
      </div>

      <PrintButton />
    </div>
  )
}

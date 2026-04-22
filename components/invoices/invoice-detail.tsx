'use client'

import Link from 'next/link'
import { ArrowLeft, Download } from 'lucide-react'
import { Logo } from '@/components/shared/logo'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatDate, formatUGX } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { Invoice, Client } from '@/types'

interface InvoiceDetailProps {
  invoice: Invoice
  client: Client
}

export function InvoiceDetail({ invoice, client }: InvoiceDetailProps) {
  async function handleDownloadPdf() {
    const { jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')

    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const green = [30, 80, 30] as [number, number, number]

    // Header
    doc.setFillColor(...green)
    doc.rect(0, 0, 210, 30, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('RERU', 15, 12)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('Reusable Resources — Nsasa Estate, Mukono District', 15, 20)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(invoice.id, 195, 12, { align: 'right' })
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`Date: ${formatDate(invoice.date)}`, 195, 20, { align: 'right' })

    doc.setTextColor(30, 30, 30)

    // Billed to
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('BILLED TO', 15, 42)
    doc.setFont('helvetica', 'normal')
    doc.text(client.name, 15, 49)
    doc.text(client.address, 15, 55)
    doc.text(`Phone: ${client.phone}`, 15, 61)

    // Service provider
    doc.setFont('helvetica', 'bold')
    doc.text('SERVICE PROVIDER', 120, 42)
    doc.setFont('helvetica', 'normal')
    doc.text('Mukono Countryside Mixed Farm Ltd', 120, 49)
    doc.text('Nsasa Estate, Mukono District', 120, 55)
    doc.text('Tel: 0778 527 802', 120, 61)

    // Items table
    autoTable(doc, {
      startY: 72,
      head: [['Description', 'Qty', 'Unit Price', 'Amount']],
      body: [[
        `Waste Collection Service (${invoice.plan})`,
        invoice.qty.toString(),
        formatUGX(invoice.unit_price),
        formatUGX(invoice.subtotal),
      ]],
      foot: [
        ['', '', 'Subtotal', formatUGX(invoice.subtotal)],
        ['', '', `Tax (6%)`, formatUGX(invoice.tax)],
        ['', '', 'Total', formatUGX(invoice.total)],
      ],
      headStyles: { fillColor: green, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      footStyles: { fillColor: [245, 250, 245], textColor: [30, 30, 30], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 0: { cellWidth: 90 }, 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
      margin: { left: 15, right: 15 },
    })

    // Payment instructions
    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
    doc.setFillColor(245, 250, 245)
    doc.roundedRect(15, finalY, 180, 32, 3, 3, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('PAYMENT INSTRUCTIONS', 20, finalY + 8)
    doc.setFont('helvetica', 'normal')
    doc.text('MTN MoMo: 0778 527 802  |  Airtel: 0704 132 691', 20, finalY + 16)
    doc.text('Bank of Africa — A/C 06566780001  |  Cash accepted in person', 20, finalY + 24)

    doc.save(`${invoice.id}.pdf`)
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/dashboard/invoices"
          className="inline-flex items-center gap-1 text-sm font-semibold text-reru-text-secondary hover:text-green-700 transition-colors"
        >
          <ArrowLeft size={14} /> All invoices
        </Link>
      </div>

      {/* Invoice card */}
      <div className="bg-white border border-reru-border rounded-xl shadow-card p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 pb-6 border-b border-reru-border">
          <div>
            <Logo size="md" />
            <p className="text-sm text-reru-text-muted mt-1">Reusable Resources</p>
            <p className="text-sm text-reru-text-muted">Nsasa Estate, Mukono District</p>
            <p className="text-sm text-reru-text-muted">Tel: 0778 527 802</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-extrabold text-reru-text-primary">{invoice.id}</p>
            <p className="text-md text-reru-text-muted mt-1">{formatDate(invoice.date)}</p>
            <StatusBadge status={invoice.status} className="mt-2" />
          </div>
        </div>

        {/* Billed to / From */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <p className="reru-overline text-reru-text-muted mb-2">Billed to</p>
            <p className="font-semibold text-reru-text-primary">{client.name}</p>
            <p className="text-md text-reru-text-secondary">{client.address}</p>
            <p className="text-md text-reru-text-secondary">{client.phone}</p>
          </div>
          <div>
            <p className="reru-overline text-reru-text-muted mb-2">Service provider</p>
            <p className="font-semibold text-reru-text-primary">Mukono Countryside Mixed Farm Ltd</p>
            <p className="text-md text-reru-text-secondary">Nsasa Estate, Mukono District</p>
            <p className="text-md text-reru-text-secondary">0778 527 802</p>
          </div>
        </div>

        {/* Items table */}
        <div className="border border-reru-border rounded-lg overflow-hidden mb-6">
          <table className="w-full">
            <thead>
              <tr className="bg-green-50 border-b border-reru-border">
                <th className="px-4 py-3 text-left reru-overline text-reru-text-muted">Description</th>
                <th className="px-4 py-3 text-center reru-overline text-reru-text-muted">Qty</th>
                <th className="px-4 py-3 text-right reru-overline text-reru-text-muted">Unit price</th>
                <th className="px-4 py-3 text-right reru-overline text-reru-text-muted">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-4 text-md text-reru-text-primary">
                  Waste Collection Service ({invoice.plan})
                </td>
                <td className="px-4 py-4 text-md text-reru-text-secondary text-center">{invoice.qty}</td>
                <td className="px-4 py-4 text-md text-reru-text-secondary text-right">{formatUGX(invoice.unit_price)}</td>
                <td className="px-4 py-4 text-md font-semibold text-reru-text-primary text-right">{formatUGX(invoice.subtotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-md text-reru-text-secondary">
              <span>Subtotal</span><span>{formatUGX(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-md text-reru-text-secondary">
              <span>Tax (6%)</span><span>{formatUGX(invoice.tax)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-reru-text-primary border-t border-reru-border pt-2">
              <span>Total</span><span>{formatUGX(invoice.total)}</span>
            </div>
          </div>
        </div>

        {/* Payment instructions */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-5 mb-6">
          <p className="reru-label text-green-700 mb-3">Payment instructions</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-reru-text-secondary">
            <p><span className="font-semibold">MTN MoMo:</span> 0778 527 802</p>
            <p><span className="font-semibold">Airtel:</span> 0704 132 691</p>
            <p><span className="font-semibold">Bank of Africa:</span> A/C 06566780001</p>
          </div>
        </div>

        <Button onClick={handleDownloadPdf} className="bg-green-700 hover:bg-green-600 text-white gap-2">
          <Download size={16} /> Download PDF
        </Button>
      </div>
    </div>
  )
}

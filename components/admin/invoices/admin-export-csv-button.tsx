'use client'

import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AdminExportCsvButtonProps {
  statusFilter?: string
}

export function AdminExportCsvButton({ statusFilter }: AdminExportCsvButtonProps) {
  function handleExport() {
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    const qs = params.toString()
    window.location.href = `/api/admin/invoices/export${qs ? `?${qs}` : ''}`
  }

  return (
    <Button variant="outline" onClick={handleExport} className="gap-2">
      <Download size={14} /> Export CSV
    </Button>
  )
}

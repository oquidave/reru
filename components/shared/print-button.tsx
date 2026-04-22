'use client'

import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PrintButton() {
  return (
    <Button
      onClick={() => window.print()}
      variant="outline"
      className="gap-2 border-reru-border text-reru-text-secondary hover:text-green-700 hover:border-green-200"
    >
      <Printer size={16} /> Print agreement
    </Button>
  )
}

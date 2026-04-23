'use client'

import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AdminErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AdminError({ error, reset }: AdminErrorProps) {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="bg-white border border-reru-border rounded-xl shadow-card p-10 text-center max-w-sm w-full">
        <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={20} strokeWidth={1.8} className="text-reru-danger" />
        </div>
        <h2 className="reru-card-title text-reru-text-primary mb-2">Something went wrong</h2>
        <p className="reru-body text-reru-text-secondary mb-6">
          {error.message && !error.message.toLowerCase().includes('internal')
            ? error.message
            : 'An unexpected error occurred. Please try again.'}
        </p>
        <Button onClick={reset} className="w-full">Try again</Button>
      </div>
    </div>
  )
}

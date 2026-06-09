'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { MapPinPlus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
})

type FormValues = z.infer<typeof schema>

export function AdminAddLocationDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '' },
  })

  async function onSubmit(values: FormValues) {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const json = await res.json() as { ok: boolean; error?: string }
      if (!json.ok) {
        toast.error(json.error ?? 'Failed to add location')
        return
      }
      toast.success(`${values.name} added`)
      form.reset()
      setOpen(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) form.reset() }}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <MapPinPlus size={15} /> Add location
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add service location</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-2 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="loc-name">Location name</Label>
            <Input id="loc-name" {...form.register('name')} placeholder="e.g. Kyaliwajjala" autoComplete="off" />
            {form.formState.errors.name && (
              <p className="text-sm text-reru-danger">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Adding…' : 'Add location'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

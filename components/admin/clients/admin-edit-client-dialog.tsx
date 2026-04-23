'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Pencil } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Client } from '@/types'

const schema = z.object({
  address:        z.string().min(1, 'Address is required').max(500),
  zone:           z.enum(['Zone A', 'Zone B', 'Zone C']),
  collection_day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
  plan:           z.enum(['monthly', 'annual']),
})

type FormValues = z.infer<typeof schema>

interface AdminEditClientDialogProps {
  client: Client
}

export function AdminEditClientDialog({ client }: AdminEditClientDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      address:        client.address,
      zone:           client.zone,
      collection_day: client.collection_day,
      plan:           client.plan,
    },
  })

  async function onSubmit(values: FormValues) {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/clients/${client.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(values),
      })
      const json = await res.json() as { ok: boolean; error?: string }

      if (!json.ok) {
        toast.error(json.error ?? 'Failed to update client')
        return
      }

      toast.success('Client updated successfully')
      setOpen(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Pencil size={14} /> Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit client — {client.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="address">Address</Label>
            <Input id="address" {...form.register('address')} disabled={loading} />
            {form.formState.errors.address && (
              <p className="text-sm text-reru-danger">{form.formState.errors.address.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Zone</Label>
            <Select
              defaultValue={client.zone}
              onValueChange={(v) => form.setValue('zone', v as FormValues['zone'])}
              disabled={loading}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(['Zone A', 'Zone B', 'Zone C'] as const).map((z) => (
                  <SelectItem key={z} value={z}>{z}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Collection day</Label>
            <Select
              defaultValue={client.collection_day}
              onValueChange={(v) => form.setValue('collection_day', v as FormValues['collection_day'])}
              disabled={loading}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const).map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Plan</Label>
            <Select
              defaultValue={client.plan}
              onValueChange={(v) => form.setValue('plan', v as FormValues['plan'])}
              disabled={loading}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly — UGX 25,000/mo</SelectItem>
                <SelectItem value="annual">Annual — UGX 240,000/yr</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

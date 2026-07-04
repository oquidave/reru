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
import type { PricingTier } from '@/types'

const schema = z.object({
  name:        z.string().min(2, 'Name required').max(100),
  price:       z.string().optional(),
  description: z.string().max(300).optional(),
  is_public:   z.enum(['true', 'false']),
  sort_order:  z.coerce.number().int().min(0),
})

type FormValues = z.infer<typeof schema>

export function AdminEditTierDialog({ tier }: { tier: PricingTier }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name:        tier.name,
      price:       tier.price !== null ? String(tier.price) : '',
      description: tier.description ?? '',
      is_public:   tier.is_public ? 'true' : 'false',
      sort_order:  tier.sort_order,
    },
  })

  async function onSubmit(values: FormValues) {
    setLoading(true)
    try {
      const price = values.price ? parseInt(values.price, 10) : null
      const res = await fetch(`/api/admin/pricing/${tier.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:        values.name,
          price,
          description: values.description || null,
          is_public:   values.is_public === 'true',
          sort_order:  values.sort_order,
        }),
      })
      const json = await res.json() as { ok: boolean; error?: string }
      if (!json.ok) { toast.error(json.error ?? 'Failed to update tier'); return }
      toast.success('Tier updated')
      setOpen(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Pencil size={14} /> Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit tier — {tier.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input {...form.register('name')} disabled={loading} />
            {form.formState.errors.name && <p className="text-xs text-reru-danger">{form.formState.errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Price (UGX){tier.billing_period === 'custom' && <span className="text-reru-text-muted"> — set per client</span>}</Label>
            <Input
              {...form.register('price')}
              type="number"
              min={0}
              disabled={loading || tier.billing_period === 'custom'}
              placeholder={tier.billing_period === 'custom' ? 'Per client' : '25000'}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input {...form.register('description')} disabled={loading} placeholder="Optional description shown on pricing cards" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Visibility</Label>
              <Select
                defaultValue={tier.is_public ? 'true' : 'false'}
                onValueChange={(v) => form.setValue('is_public', v as FormValues['is_public'])}
                disabled={loading}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Public</SelectItem>
                  <SelectItem value="false">Admin only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Sort order</Label>
              <Input {...form.register('sort_order')} type="number" min={0} disabled={loading} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Saving…' : 'Save changes'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

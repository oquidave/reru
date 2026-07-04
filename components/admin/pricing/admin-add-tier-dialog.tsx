'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { PlusCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const schema = z.object({
  name:           z.string().min(2, 'Name required').max(100),
  slug:           z.string().min(2, 'Slug required').max(60).regex(/^[a-z0-9_]+$/, 'Lowercase, numbers, underscores only'),
  price:          z.string().optional(),
  billing_period: z.enum(['month', 'year', 'custom']),
  description:    z.string().max(300).optional(),
  is_public:      z.enum(['true', 'false']),
  sort_order:     z.coerce.number().int().min(0).default(0),
})

type FormValues = z.infer<typeof schema>

export function AdminAddTierDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { billing_period: 'month', is_public: 'true', sort_order: 0 },
  })

  const billingPeriod = form.watch('billing_period')

  async function onSubmit(values: FormValues) {
    setLoading(true)
    try {
      const price = values.price ? parseInt(values.price, 10) : null
      const res = await fetch('/api/admin/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:           values.name,
          slug:           values.slug,
          price,
          billing_period: values.billing_period,
          description:    values.description || null,
          is_public:      values.is_public === 'true',
          sort_order:     values.sort_order,
        }),
      })
      const json = await res.json() as { ok: boolean; error?: string }
      if (!json.ok) { toast.error(json.error ?? 'Failed to create tier'); return }
      toast.success('Pricing tier created')
      setOpen(false)
      form.reset()
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2"><PlusCircle size={15} /> Add tier</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add pricing tier</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input {...form.register('name')} placeholder="Apartment – Monthly" disabled={loading} />
              {form.formState.errors.name && <p className="text-xs text-reru-danger">{form.formState.errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input {...form.register('slug')} placeholder="apartment_monthly" disabled={loading} />
              {form.formState.errors.slug && <p className="text-xs text-reru-danger">{form.formState.errors.slug.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Billing period</Label>
              <Select
                defaultValue="month"
                onValueChange={(v) => form.setValue('billing_period', v as FormValues['billing_period'])}
                disabled={loading}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Monthly</SelectItem>
                  <SelectItem value="year">Annual</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Price (UGX){billingPeriod === 'custom' && <span className="text-reru-text-muted"> — leave blank</span>}</Label>
              <Input
                {...form.register('price')}
                type="number"
                min={0}
                placeholder={billingPeriod === 'custom' ? 'Per client' : '25000'}
                disabled={loading || billingPeriod === 'custom'}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Description (optional)</Label>
            <Input {...form.register('description')} placeholder="Flexible. Cancel anytime." disabled={loading} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Visibility</Label>
              <Select
                defaultValue="true"
                onValueChange={(v) => form.setValue('is_public', v as FormValues['is_public'])}
                disabled={loading}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Public (shown to clients)</SelectItem>
                  <SelectItem value="false">Admin only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Sort order</Label>
              <Input {...form.register('sort_order')} type="number" min={0} placeholder="0" disabled={loading} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create tier'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

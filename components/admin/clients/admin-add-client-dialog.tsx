'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { UserPlus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const step1Schema = z.object({
  name:  z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone must be at least 10 characters'),
})

const step2Schema = z.object({
  address:        z.string().min(5, 'Address must be at least 5 characters'),
  zone:           z.enum(['Zone A', 'Zone B', 'Zone C']),
  collection_day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
  plan:           z.enum(['monthly', 'annual']),
})

type Step1Values = z.infer<typeof step1Schema>
type Step2Values = z.infer<typeof step2Schema>

export function AdminAddClientDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const [step1Data, setStep1Data] = useState<Step1Values | null>(null)
  const [loading, setLoading] = useState(false)

  const form1 = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: { name: '', email: '', phone: '' },
  })

  const form2 = useForm<Step2Values>({
    resolver: zodResolver(step2Schema),
    defaultValues: { address: '', zone: 'Zone A', collection_day: 'Monday', plan: 'monthly' },
  })

  function handleStep1(values: Step1Values) {
    setStep1Data(values)
    setStep(2)
  }

  async function handleStep2(values: Step2Values) {
    if (!step1Data) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/clients', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...step1Data, ...values }),
      })
      const json = await res.json() as { ok: boolean; error?: string }

      if (!json.ok) {
        if (res.status === 409) {
          toast.error('This email address is already registered.')
          setStep(1)
        } else {
          toast.error(json.error ?? 'Failed to add client')
        }
        return
      }

      toast.success('Client added. A password-setup email has been sent.')
      handleClose(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  function handleClose(v: boolean) {
    setOpen(v)
    if (!v) {
      setStep(1)
      setStep1Data(null)
      form1.reset()
      form2.reset()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus size={15} /> Add client
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add client — step {step} of 2</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <form onSubmit={form1.handleSubmit(handleStep1)} className="mt-2 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="add-name">Full name</Label>
              <Input id="add-name" {...form1.register('name')} autoComplete="off" />
              {form1.formState.errors.name && (
                <p className="text-sm text-reru-danger">{form1.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="add-email">Email address</Label>
              <Input id="add-email" type="email" {...form1.register('email')} autoComplete="off" />
              {form1.formState.errors.email && (
                <p className="text-sm text-reru-danger">{form1.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="add-phone">Phone number</Label>
              <Input id="add-phone" type="tel" {...form1.register('phone')} autoComplete="off" />
              {form1.formState.errors.phone && (
                <p className="text-sm text-reru-danger">{form1.formState.errors.phone.message}</p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit">Next</Button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={form2.handleSubmit(handleStep2)} className="mt-2 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="add-address">Residential address</Label>
              <Input id="add-address" {...form2.register('address')} disabled={loading} autoComplete="off" />
              {form2.formState.errors.address && (
                <p className="text-sm text-reru-danger">{form2.formState.errors.address.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Zone</Label>
              <Select
                defaultValue="Zone A"
                onValueChange={(v) => form2.setValue('zone', v as Step2Values['zone'])}
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
                defaultValue="Monday"
                onValueChange={(v) => form2.setValue('collection_day', v as Step2Values['collection_day'])}
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
                defaultValue="monthly"
                onValueChange={(v) => form2.setValue('plan', v as Step2Values['plan'])}
                disabled={loading}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly — UGX 25,000/mo</SelectItem>
                  <SelectItem value="annual">Annual — UGX 240,000/yr</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between pt-2">
              <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={loading}>
                Back
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Adding…' : 'Add client'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

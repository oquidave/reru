import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatUGX(amount: number): string {
  return `UGX ${amount.toLocaleString('en-UG')}`
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-UG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function daysUntil(dateStr: string): number {
  const target = new Date(dateStr)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - now.getTime()) / 86400000)
}

export function phoneToEmail(phone: string): string {
  return `${phone.replace(/\s+/g, '')}@reru.app`
}

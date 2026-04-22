import { cn } from '@/lib/utils'

type BadgeVariant = 'green' | 'blue' | 'red' | 'orange' | 'gray'

const variantStyles: Record<BadgeVariant, { bg: string; text: string; dot: string }> = {
  green:  { bg: 'bg-[var(--color-success-bg)]',  text: 'text-[var(--color-success-text)]',  dot: 'bg-green-700' },
  blue:   { bg: 'bg-[var(--color-info-bg)]',      text: 'text-[var(--color-info-text)]',      dot: 'bg-[var(--color-info-text)]' },
  red:    { bg: 'bg-[var(--color-error-bg)]',     text: 'text-[var(--color-error-text)]',     dot: 'bg-reru-danger' },
  orange: { bg: 'bg-[var(--color-warning-bg)]',   text: 'text-[var(--color-warning-text)]',   dot: 'bg-reru-warning' },
  gray:   { bg: 'bg-[var(--color-gray-bg)]',      text: 'text-[var(--color-gray-text)]',      dot: 'bg-[var(--color-gray-text)]' },
}

const statusToVariant: Record<string, BadgeVariant> = {
  active:    'green',
  completed: 'green',
  paid:      'green',
  scheduled: 'blue',
  missed:    'red',
  pending:   'orange',
  overdue:   'red',
  suspended: 'orange',
  cancelled: 'gray',
  inactive:  'gray',
}

interface StatusBadgeProps {
  status: string
  label?: string
  className?: string
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const variant = statusToVariant[status.toLowerCase()] ?? 'gray'
  const { bg, text, dot } = variantStyles[variant]
  const displayLabel = label ?? (status.charAt(0).toUpperCase() + status.slice(1))

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-sm font-semibold',
        bg,
        text,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', dot)} />
      {displayLabel}
    </span>
  )
}

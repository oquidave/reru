import { Recycle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  white?: boolean
  className?: string
}

const sizes = {
  sm: { icon: 16, text: 'text-base font-bold' },
  md: { icon: 22, text: 'text-xl font-extrabold' },
  lg: { icon: 28, text: 'text-3xl font-extrabold' },
}

export function Logo({ size = 'md', white = false, className }: LogoProps) {
  const { icon, text } = sizes[size]
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Recycle
        size={icon}
        strokeWidth={2}
        className={white ? 'text-white' : 'text-green-700'}
      />
      <span
        className={cn(
          text,
          white ? 'text-white' : 'text-green-700',
          'tracking-tight'
        )}
      >
        RERU
      </span>
    </div>
  )
}

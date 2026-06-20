import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  white?: boolean
  className?: string
}

const sizes = {
  sm: 32,
  md: 40,
  lg: 56,
}

export function Logo({ size = 'md', white = false, className }: LogoProps) {
  const px = sizes[size]
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center overflow-hidden',
        // On dark surfaces, sit the white-background mark on a clean rounded tile.
        white ? 'bg-white rounded-md p-1 shadow-card' : '',
        className
      )}
    >
      <Image
        src="/images/REUSABLE-logo.png"
        alt="RERU — Reusable Resources"
        width={px}
        height={px}
        priority
        className="object-contain"
        style={{ width: px, height: px }}
      />
    </div>
  )
}

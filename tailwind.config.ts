import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // RERU green scale (OKLCH via CSS vars)
        'green-900': 'var(--color-green-900)',
        'green-700': 'var(--color-green-700)',
        'green-600': 'var(--color-green-600)',
        'green-500': 'var(--color-green-500)',
        'green-400': 'var(--color-green-400)',
        'green-200': 'var(--color-green-200)',
        'green-100': 'var(--color-green-100)',
        'green-50':  'var(--color-green-50)',
        // RERU semantic surface
        'reru-bg':      'var(--color-bg)',
        'reru-surface': 'var(--color-surface)',
        'reru-border':  'var(--color-border)',
        // RERU semantic text
        'reru-text-primary':   'var(--color-text-primary)',
        'reru-text-secondary': 'var(--color-text-secondary)',
        'reru-text-muted':     'var(--color-text-muted)',
        // RERU status colors
        'reru-accent':  'var(--color-accent)',
        'reru-danger':  'var(--color-danger)',
        'reru-warning': 'var(--color-warning)',
        // shadcn semantic vars (required for shadcn/ui components)
        background:  'var(--background)',
        foreground:  'var(--foreground)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        border: 'var(--border)',
        input:  'var(--input)',
        ring:   'var(--ring)',
      },
      borderRadius: {
        sm:   'var(--radius-sm)',
        md:   'var(--radius-md)',
        lg:   'var(--radius-lg)',
        xl:   'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        full: 'var(--radius-full)',
      },
      fontSize: {
        'xs':   ['var(--text-xs)', { lineHeight: '1.5' }],
        'sm':   ['var(--text-sm)', { lineHeight: '1.5' }],
        'base': ['var(--text-base)', { lineHeight: '1.5' }],
        'md':   ['var(--text-md)', { lineHeight: '1.6' }],
        'lg':   ['var(--text-lg)', { lineHeight: '1.5' }],
        'xl':   ['var(--text-xl)', { lineHeight: '1.4' }],
        '2xl':  ['var(--text-2xl)', { lineHeight: '1.3' }],
        '3xl':  ['var(--text-3xl)', { lineHeight: '1.2' }],
        '4xl':  ['var(--text-4xl)', { lineHeight: '1.1' }],
        '5xl':  ['var(--text-5xl)', { lineHeight: '1.1' }],
        '6xl':  ['var(--text-6xl)', { lineHeight: '1.0' }],
        'hero': ['var(--text-hero)', { lineHeight: '1.1' }],
      },
      boxShadow: {
        'card':        'var(--shadow-card)',
        'card-hover':  'var(--shadow-card-hover)',
        'card-raised': 'var(--shadow-card-raised)',
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', '-apple-system', 'sans-serif'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config

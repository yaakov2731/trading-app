import type { Config } from 'tailwindcss'
import { fontFamily } from 'tailwindcss/defaultTheme'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', ...fontFamily.sans],
        mono: ['var(--font-geist-mono)', ...fontFamily.mono],
      },
      colors: {
        // Brand palette
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        // Slate - primary text / backgrounds
        slate: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          150: '#eaeff5',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        // Accent orange
        amber: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        // Status colors
        success: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        warning: {
          50:  '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
        },
        danger: {
          50:  '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
      },
      borderRadius: {
        'xs': '4px',
        'sm': '6px',
        DEFAULT: '8px',
        'md': '10px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        // Elevation system
        'xs':    '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'sm':    '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        DEFAULT: '0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06)',
        'md':    '0 6px 12px -2px rgb(0 0 0 / 0.1), 0 3px 6px -3px rgb(0 0 0 / 0.06)',
        'lg':    '0 10px 24px -4px rgb(0 0 0 / 0.1), 0 4px 8px -4px rgb(0 0 0 / 0.06)',
        'xl':    '0 20px 40px -8px rgb(0 0 0 / 0.12), 0 8px 16px -6px rgb(0 0 0 / 0.06)',
        '2xl':   '0 24px 48px -12px rgb(0 0 0 / 0.18)',
        // 3D button shadows
        'btn-primary':         '0 4px 0 #1d4ed8, 0 5px 8px rgba(37, 99, 235, 0.3)',
        'btn-primary-hover':   '0 5px 0 #1d4ed8, 0 6px 12px rgba(37, 99, 235, 0.35)',
        'btn-primary-active':  '0 1px 0 #1d4ed8, 0 2px 4px rgba(37, 99, 235, 0.2)',
        'btn-secondary':       '0 3px 0 #94a3b8, 0 4px 6px rgba(0, 0, 0, 0.08)',
        'btn-secondary-hover': '0 4px 0 #94a3b8, 0 5px 8px rgba(0, 0, 0, 0.1)',
        'btn-secondary-active':'0 1px 0 #94a3b8, 0 2px 3px rgba(0, 0, 0, 0.06)',
        'btn-danger':          '0 4px 0 #b91c1c, 0 5px 8px rgba(220, 38, 38, 0.3)',
        'btn-danger-hover':    '0 5px 0 #b91c1c, 0 6px 12px rgba(220, 38, 38, 0.35)',
        'btn-danger-active':   '0 1px 0 #b91c1c, 0 2px 4px rgba(220, 38, 38, 0.2)',
        'btn-success':         '0 4px 0 #15803d, 0 5px 8px rgba(22, 163, 74, 0.3)',
        'btn-success-hover':   '0 5px 0 #15803d, 0 6px 12px rgba(22, 163, 74, 0.35)',
        'btn-success-active':  '0 1px 0 #15803d, 0 2px 4px rgba(22, 163, 74, 0.2)',
        // Card shadows
        'card':      '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover':'0 4px 12px -2px rgb(0 0 0 / 0.1), 0 2px 6px -2px rgb(0 0 0 / 0.06)',
        // Input focus
        'input-focus': '0 0 0 3px rgba(59, 130, 246, 0.15)',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '68': '17rem',
        '72': '18rem',
        '76': '19rem',
        '80': '20rem',
        '88': '22rem',
        '96': '24rem',
      },
      animation: {
        'fade-in':    'fadeIn 0.15s ease-out',
        'fade-up':    'fadeUp 0.2s ease-out',
        'slide-in-right': 'slideInRight 0.2s ease-out',
        'scale-in':   'scaleIn 0.15s ease-out',
        'spin-slow':  'spin 2s linear infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'snappy': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      gridTemplateColumns: {
        'sidebar': '280px 1fr',
        'sidebar-collapsed': '72px 1fr',
      },
    },
  },
  plugins: [],
}

export default config

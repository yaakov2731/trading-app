import type { Metadata } from 'next'
import { LoginForm } from './login-form'

export const metadata: Metadata = {
  title: 'Iniciar sesión',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* ── Left: branding panel ─────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-2/5 bg-slate-900 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background grid pattern */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Gradient orb */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-12 w-80 h-80 bg-brand-400/10 rounded-full blur-3xl" />

        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <span className="text-xl font-bold text-white">GastroStock</span>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight">
              Control total
              <br />
              <span className="text-brand-400">de inventario.</span>
            </h1>
            <p className="mt-4 text-slate-400 text-lg leading-relaxed">
              Sistema de gestión de stock para negocios
              gastronómicos multi-local. Rápido, preciso
              y siempre al día.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2">
            {['Movimientos en tiempo real', 'Multi-local', 'Alertas automáticas', 'Exportación Excel', 'Kardex completo'].map(f => (
              <span key={f} className="px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300">
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Location badges */}
        <div className="relative z-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">Locales</p>
          <div className="flex flex-wrap gap-2">
            {[
              { name: 'Umo Grill',    color: '#3b82f6' },
              { name: 'Puerto Gelato',color: '#f59e0b' },
              { name: 'Brooklyn',     color: '#8b5cf6' },
              { name: 'Trento Cafe',  color: '#06b6d4' },
              { name: 'Eventos',      color: '#10b981' },
              { name: 'Shopping',     color: '#f43f5e' },
            ].map(loc => (
              <div key={loc.name} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: loc.color }} />
                <span className="text-xs font-medium text-slate-300">{loc.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: login form ────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <span className="text-lg font-bold text-slate-900">GastroStock</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Bienvenido</h2>
            <p className="mt-1 text-slate-500">Ingresá con tu cuenta para continuar</p>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  )
}

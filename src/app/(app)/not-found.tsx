/**
 * app/(app)/not-found.tsx
 * Premium 404 page.
 */

import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl
          bg-slate-800 border border-slate-700 mb-8">
          <span className="text-4xl font-bold text-slate-600">404</span>
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">Página no encontrada</h1>
        <p className="text-slate-400 mb-8">
          La página que buscás no existe o fue movida.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-xl font-semibold text-sm bg-brand-500 hover:bg-brand-400
              text-white border border-brand-400 shadow-lg shadow-brand-900/40 transition-all active:scale-95"
          >
            Ir al dashboard
          </Link>
          <Link
            href="javascript:history.back()"
            className="px-6 py-3 rounded-xl font-semibold text-sm bg-slate-800 hover:bg-slate-700
              text-slate-300 border border-slate-700 transition-colors"
          >
            Volver atrás
          </Link>
        </div>
      </div>
    </div>
  )
}

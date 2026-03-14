/**
 * app/api/_shared/api-errors.ts
 * Unified error handler for all API routes.
 * Import and use `handleApiError` as the catch clause in every route.
 */

import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export interface ApiErrorResponse {
  error: string
  code: string
  details?: unknown
}

export function handleApiError(err: unknown): NextResponse<ApiErrorResponse> {
  // Zod validation errors
  if (err instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Datos inválidos',
        code: 'VALIDATION_ERROR',
        details: err.flatten().fieldErrors,
      },
      { status: 422 }
    )
  }

  if (err instanceof Error) {
    const msg = err.message

    // Auth errors
    if (msg.includes('Unauthorized') || msg.includes('No autorizado')) {
      return NextResponse.json({ error: 'No autorizado', code: 'UNAUTHORIZED' }, { status: 401 })
    }
    if (msg.includes('missing permission') || msg.includes('requires role') || msg.includes('Sin permisos')) {
      return NextResponse.json({ error: 'Sin permisos', code: 'FORBIDDEN' }, { status: 403 })
    }
    if (msg.includes('no access to location')) {
      return NextResponse.json({ error: 'Sin acceso a esta ubicación', code: 'FORBIDDEN' }, { status: 403 })
    }

    // Business rule conflicts
    if (msg.includes('already received') || msg.includes('already applied') || msg.includes('Duplicate')) {
      return NextResponse.json({ error: msg, code: 'CONFLICT' }, { status: 409 })
    }

    // Not found
    if (msg.includes('not found') || msg.includes('no encontrado')) {
      return NextResponse.json({ error: msg, code: 'NOT_FOUND' }, { status: 404 })
    }

    // Log internal errors
    console.error('[api-error]', err.message, err.stack)

    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === 'development'
            ? err.message
            : 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }

  console.error('[api-error] Unknown error:', err)
  return NextResponse.json(
    { error: 'Error desconocido', code: 'UNKNOWN' },
    { status: 500 }
  )
}

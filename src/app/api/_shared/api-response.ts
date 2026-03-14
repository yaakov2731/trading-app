/**
 * app/api/_shared/api-response.ts
 * Consistent API response builders for all route handlers.
 */

import { NextResponse } from 'next/server'

// ── Success responses ─────────────────────────────────────────────────────────

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status })
}

export function created<T>(data: T): NextResponse {
  return NextResponse.json(data, { status: 201 })
}

export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 })
}

// ── Error responses ───────────────────────────────────────────────────────────

export function badRequest(message = 'Solicitud inválida', details?: unknown): NextResponse {
  return NextResponse.json(
    { error: message, code: 'BAD_REQUEST', details },
    { status: 400 }
  )
}

export function unauthorized(message = 'No autorizado'): NextResponse {
  return NextResponse.json({ error: message, code: 'UNAUTHORIZED' }, { status: 401 })
}

export function forbidden(message = 'Sin permisos'): NextResponse {
  return NextResponse.json({ error: message, code: 'FORBIDDEN' }, { status: 403 })
}

export function notFound(entity = 'Recurso'): NextResponse {
  return NextResponse.json(
    { error: `${entity} no encontrado`, code: 'NOT_FOUND' },
    { status: 404 }
  )
}

export function conflict(message: string): NextResponse {
  return NextResponse.json({ error: message, code: 'CONFLICT' }, { status: 409 })
}

export function unprocessable(message: string, details?: unknown): NextResponse {
  return NextResponse.json(
    { error: message, code: 'VALIDATION_ERROR', details },
    { status: 422 }
  )
}

export function internalError(message = 'Error interno del servidor'): NextResponse {
  return NextResponse.json({ error: message, code: 'INTERNAL_ERROR' }, { status: 500 })
}

// ── Excel response ────────────────────────────────────────────────────────────

export function xlsxResponse(buffer: Buffer, filename: string): NextResponse {
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}

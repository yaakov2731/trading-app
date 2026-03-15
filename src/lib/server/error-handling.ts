/**
 * lib/server/error-handling.ts
 * Normalized error handling for server functions and API routes.
 */

import { ZodError } from 'zod'

// ── Typed application errors ──────────────────────────────────────────────────

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400,
    public readonly details?: unknown
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'No autorizado') {
    super(message, 'UNAUTHORIZED', 401)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Sin permisos para realizar esta acción') {
    super(message, 'FORBIDDEN', 403)
    this.name = 'ForbiddenError'
  }
}

export class NotFoundError extends AppError {
  constructor(entity = 'Recurso') {
    super(`${entity} no encontrado`, 'NOT_FOUND', 404)
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409)
    this.name = 'ConflictError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 422, details)
    this.name = 'ValidationError'
  }
}

// ── Error normalization ───────────────────────────────────────────────────────

export interface NormalizedError {
  error: string
  code: string
  statusCode: number
  details?: unknown
}

export function normalizeError(err: unknown): NormalizedError {
  if (err instanceof AppError) {
    return {
      error: err.message,
      code: err.code,
      statusCode: err.statusCode,
      details: err.details,
    }
  }

  if (err instanceof ZodError) {
    return {
      error: 'Datos inválidos',
      code: 'VALIDATION_ERROR',
      statusCode: 422,
      details: err.flatten().fieldErrors,
    }
  }

  if (err instanceof Error) {
    // Check for auth errors from requireSession/requireAdmin
    if (err.message.includes('Unauthorized') || err.message.includes('No autorizado')) {
      return { error: 'No autorizado', code: 'UNAUTHORIZED', statusCode: 401 }
    }
    if (err.message.includes('missing permission')) {
      return { error: 'Sin permisos', code: 'FORBIDDEN', statusCode: 403 }
    }
    if (err.message.includes('requires role')) {
      return { error: 'Rol insuficiente', code: 'FORBIDDEN', statusCode: 403 }
    }

    // Log internal details, return safe message
    console.error('[error-handling]', err.message, err.stack)
    return {
      error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno del servidor',
      code: 'INTERNAL_ERROR',
      statusCode: 500,
    }
  }

  return { error: 'Error desconocido', code: 'UNKNOWN', statusCode: 500 }
}

// ── API route error handler ───────────────────────────────────────────────────

import { NextResponse } from 'next/server'

export function apiError(err: unknown): NextResponse {
  const normalized = normalizeError(err)
  return NextResponse.json(
    { error: normalized.error, code: normalized.code, details: normalized.details },
    { status: normalized.statusCode }
  )
}

export function apiSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status })
}

// ── Safe server action wrapper ────────────────────────────────────────────────

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: string }

export async function safeAction<T>(
  fn: () => Promise<T>
): Promise<ActionResult<T>> {
  try {
    const data = await fn()
    return { success: true, data }
  } catch (err) {
    const normalized = normalizeError(err)
    return { success: false, error: normalized.error, code: normalized.code }
  }
}

// ── Guard helpers ─────────────────────────────────────────────────────────────

export function assertDefined<T>(value: T | null | undefined, entity = 'Recurso'): T {
  if (value === null || value === undefined) throw new NotFoundError(entity)
  return value
}

export function assertFalse(condition: boolean, message: string, code = 'CONFLICT'): void {
  if (condition) throw new AppError(message, code, 409)
}

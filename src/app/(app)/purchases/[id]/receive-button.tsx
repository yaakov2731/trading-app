'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Loader2, PackageCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ReceiveButtonProps {
  entryId: string
  onReceive: () => Promise<void>
}

export function ReceiveButton({ entryId, onReceive }: ReceiveButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleReceive() {
    startTransition(async () => {
      try {
        await onReceive()
        setDone(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al recibir')
      }
    })
  }

  if (done) {
    return (
      <div className="flex items-center gap-1.5 rounded-xl bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
        <CheckCircle2 className="h-4 w-4" />
        Recibido
      </div>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="primary"
        onClick={handleReceive}
        disabled={isPending}
        className="flex items-center gap-2"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Procesando…
          </>
        ) : (
          <>
            <PackageCheck className="h-4 w-4" />
            Confirmar recepción
          </>
        )}
      </Button>
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}

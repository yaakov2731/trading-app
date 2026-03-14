/**
 * hooks/use-debounced-value.ts
 * Returns a debounced version of the given value.
 */

'use client'

import { useState, useEffect } from 'react'

export function useDebouncedValue<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}

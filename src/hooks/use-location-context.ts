/**
 * hooks/use-location-context.ts
 * Client hook for location selection state.
 */

'use client'

import { useState, useCallback } from 'react'

export interface LocationOption {
  id: string
  name: string
  slug: string
}

export function useLocationContext(initial: LocationOption | null = null) {
  const [selectedLocation, setSelectedLocation] = useState<LocationOption | null>(initial)

  const selectLocation = useCallback((loc: LocationOption | null) => {
    setSelectedLocation(loc)
  }, [])

  const clearLocation = useCallback(() => {
    setSelectedLocation(null)
  }, [])

  return {
    selectedLocation,
    selectLocation,
    clearLocation,
    locationId: selectedLocation?.id ?? null,
    locationName: selectedLocation?.name ?? null,
  }
}

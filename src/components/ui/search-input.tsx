/**
 * components/ui/search-input.tsx
 * Debounced search input for filter bars.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'

interface SearchInputProps {
  defaultValue?: string
  placeholder?: string
  onSearch?: (value: string) => void
  name?: string
  delay?: number
  className?: string
}

export default function SearchInput({
  defaultValue = '',
  placeholder = 'Buscar...',
  onSearch,
  name = 'q',
  delay = 350,
  className = '',
}: SearchInputProps) {
  const [value, setValue] = useState(defaultValue)

  const debouncedSearch = useCallback(
    (val: string) => {
      if (onSearch) {
        const timer = setTimeout(() => onSearch(val), delay)
        return () => clearTimeout(timer)
      }
    },
    [onSearch, delay]
  )

  useEffect(() => {
    const cleanup = debouncedSearch(value)
    return cleanup
  }, [value, debouncedSearch])

  return (
    <div className={`relative ${className}`}>
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="search"
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300
          placeholder:text-slate-500 focus:outline-none focus:border-brand-500 transition-colors w-full sm:w-56"
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'

// Browser-only persistence for clearly labelled demonstration data.
export default function useLocalDemoState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = window.localStorage.getItem(key)
      return saved === null ? initialValue : JSON.parse(saved)
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Keep the demonstration usable if browser storage is unavailable.
    }
  }, [key, value])

  return [value, setValue]
}

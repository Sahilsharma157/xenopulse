'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export default function TopLoader() {
  const [loading, setLoading] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [pathname])

  if (!loading) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 h-[2px] bg-[#2563EB]"
      style={{
        animation: 'toploader 0.5s ease-in-out',
      }}
    />
  )
}

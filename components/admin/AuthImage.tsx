'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { fetchPrivateFile } from '@/lib/api/storage'

interface AuthImageProps {
  src: string
  alt: string
  width: number
  height: number
  className?: string
  style?: React.CSSProperties
}

// Renders an image from a private storage bucket by fetching it with the admin token
export function AuthImage({ src, alt, width, height, className, style }: AuthImageProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let url: string | null = null
    let cancelled = false
    setObjectUrl(null)
    setFailed(false)
    ;(async () => {
      try {
        const blob = await fetchPrivateFile(src)
        if (cancelled) return
        url = URL.createObjectURL(blob)
        setObjectUrl(url)
      } catch {
        if (!cancelled) setFailed(true)
      }
    })()
    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [src])

  if (failed) {
    return <div className={`bg-gray-100 text-gray-500 text-sm flex items-center justify-center ${className ?? ''}`} style={{ width, height, ...style }}>Failed to load</div>
  }
  if (!objectUrl) {
    return <div className={`bg-gray-100 animate-pulse ${className ?? ''}`} style={{ width, height, ...style }} />
  }
  return <Image src={objectUrl} alt={alt} width={width} height={height} className={className} style={style} unoptimized />
}

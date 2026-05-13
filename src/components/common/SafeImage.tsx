import { useState } from 'react'
import { FALLBACK_COVER } from '../../lib/constants'

interface SafeImageProps {
  src?: string | null
  alt: string
  className?: string
  loading?: 'lazy' | 'eager'
}

export function SafeImage({ src, alt, className, loading = 'lazy' }: SafeImageProps) {
  const [failed, setFailed] = useState(false)
  const safeSrc = !failed && src ? src : FALLBACK_COVER

  return (
    <img
      src={safeSrc}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      draggable={false}
      onError={() => setFailed(true)}
    />
  )
}

'use client'

import { useEffect } from 'react'
import { Photo } from '@/lib/supabase'

interface LightboxProps {
  photos: Photo[]
  currentPhoto: Photo
  onClose: () => void
  onNavigate: (photo: Photo) => void
}

export const Lightbox = ({ photos, currentPhoto, onClose, onNavigate }: LightboxProps) => {
  const currentIndex = photos.findIndex((p) => p.id === currentPhoto.id)
  const prev = currentIndex > 0 ? photos[currentIndex - 1] : null
  const next = currentIndex < photos.length - 1 ? photos[currentIndex + 1] : null

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && prev) onNavigate(prev)
      if (e.key === 'ArrowRight' && next) onNavigate(next)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, prev, next, onNavigate])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 text-white/60 hover:text-white text-3xl z-10 w-10 h-10 flex items-center justify-center transition-colors"
        onClick={onClose}
      >
        ×
      </button>

      {prev && (
        <button
          className="absolute left-3 md:left-6 text-white/60 hover:text-white text-4xl z-10 w-12 h-12 flex items-center justify-center transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            onNavigate(prev)
          }}
        >
          ‹
        </button>
      )}

      <div
        className="max-w-5xl w-full max-h-[90vh] px-16 flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={currentPhoto.public_url}
          alt={currentPhoto.caption || ''}
          className="max-h-[80vh] max-w-full object-contain"
        />
        {currentPhoto.caption && (
          <p className="text-white/60 text-sm text-center mt-3 max-w-lg">{currentPhoto.caption}</p>
        )}
        <p className="text-white/25 text-xs text-center mt-2">
          {currentIndex + 1} / {photos.length}
        </p>
      </div>

      {next && (
        <button
          className="absolute right-3 md:right-6 text-white/60 hover:text-white text-4xl z-10 w-12 h-12 flex items-center justify-center transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            onNavigate(next)
          }}
        >
          ›
        </button>
      )}
    </div>
  )
}

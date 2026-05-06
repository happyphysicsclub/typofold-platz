'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { supabase, Photo } from '@/lib/supabase'
import { CameraCapture } from '@/components/CameraCapture'
import { CaptionModal } from '@/components/CaptionModal'
import { Lightbox } from '@/components/Lightbox'

export default function GalleryPage() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [version, setVersion] = useState(0)
  const [showCamera, setShowCamera] = useState(false)
  const [captured, setCaptured] = useState<{ blob: Blob; width: number; height: number } | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .not('hidden', 'eq', true)
        .order('uploaded_at', { ascending: false })

      if (!active) return
      if (!error && data) setPhotos(data as Photo[])
      setLoading(false)
    }

    load()
    return () => {
      active = false
    }
  }, [version])

  const handleCapture = (blob: Blob, width: number, height: number) => {
    setCaptured({ blob, width, height })
    setShowCamera(false)
  }

  const handleRetake = () => {
    setCaptured(null)
    setShowCamera(true)
  }

  return (
    <div className='min-h-screen pb-32 p-2'>
      {/* Header */}
      <header className='px-1 h-12 flex items-center mb-2'>
        <span className='font-bold text-base tracking-widest uppercase'>Typofold</span>
      </header>

      {/* Gallery */}
      {loading ? (
        <div className='flex items-center justify-center h-64'>
          <span className='text-gray text-sm animate-pulse'>불러오는 중...</span>
        </div>
      ) : photos.length === 0 ? (
        <div className='flex flex-col items-center justify-center min-h-[60vh] gap-3'>
          <p className='text-gray text-sm'>아직 사진이 없습니다.</p>
          <p className='text-gray/50 text-xs'>아래 버튼으로 첫 사진을 찍어보세요.</p>
        </div>
      ) : (
        <div className='grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 bg-black p-4'>
          {photos.map((photo) => (
            <div key={photo.id} className='cursor-pointer group flex flex-col' onClick={() => setSelectedPhoto(photo)}>
              <div className='relative w-full aspect-square overflow-hidden'>
                <Image
                  src={photo.public_url}
                  alt={photo.caption ?? ''}
                  fill
                  sizes='(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'
                  className='object-cover object-center group-hover:scale-[1.03] transition-transform duration-500'
                />
                {photo.caption && (
                  <div className='absolute top-0 left-0 w-fit text-white text-sm px-1.5 py-1.5'>☻ {photo.caption}</div>
                )}
                {photo.uploaded_at && (
                  <div className='text-[10px] p-1.5 text-right absolute bottom-0 font-mono right-0 text-orange-300/90'>
                    {new Date(photo.uploaded_at).toLocaleString('en-US', {
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <div className='fixed bottom-0 left-1/2 -translate-x-1/2 z-30 p-4 w-full px-6 h-fit bg-background backdrop-blur-sm text-black flex flex-row gap-4 items-center justify-center'>
        <button
          onClick={() => setShowCamera(true)}
          aria-label='카메라로 찍기'
          className='w-14 h-14 rounded-full transition-all flex items-center justify-center border-[1px] cursor-pointer border-black hover:bg-background hover:text-black  active:scale-95 bg-black text-white'>
          <svg
            className='w-6 h-6'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeLinecap='round'
            strokeLinejoin='round'>
            <path d='M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z' />
            <circle cx='12' cy='13' r='4' />
          </svg>
        </button>
      </div>

      {/* 카메라 */}
      {showCamera && <CameraCapture onCapture={handleCapture} onClose={() => setShowCamera(false)} />}

      {/* 캡션 모달 */}
      {captured && (
        <CaptionModal
          blob={captured.blob}
          width={captured.width}
          height={captured.height}
          onRetake={handleRetake}
          onUploadComplete={() => {
            setCaptured(null)
            setVersion((v) => v + 1)
          }}
        />
      )}

      {/* 라이트박스 */}
      {selectedPhoto && (
        <Lightbox
          photos={photos}
          currentPhoto={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          onNavigate={setSelectedPhoto}
        />
      )}
    </div>
  )
}

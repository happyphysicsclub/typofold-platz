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
    <div className='min-h-screen pb-32'>
      {/* Header */}
      <header className='top-0 z-40 bg-background px-2 h-14 flex items-center'>
        <span className='font-bold text-sm tracking-widest uppercase'>Typofold</span>
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
        <div className='columns-2 sm:columns-3 lg:columns-4 gap-1 p-1'>
          {photos.map((photo) => (
            <div
              key={photo.id}
              className='break-inside-avoid mb-1 w-full h-fit cursor-pointer group relative overflow-hidden  flex flex-col justify-center items-center'
              onClick={() => setSelectedPhoto(photo)}>
              <img
                src={photo.public_url}
                alt={photo.caption ?? ''}
                className='w-full h-auto object-center object-cover group-hover:scale-[1.03] transition-transform duration-500'
                loading='lazy'
              />
              {photo.caption && (
                <div className='absolute top-0 left-0 right-0 w-fit bg-background text-black text-xs px-2 py-1.5'>
                  {photo.caption}
                </div>
              )}
              {photo.uploaded_at && (
                <div className='w-full pl-1 text-black text-[10px] mt-1'>
                  {new Date(photo.uploaded_at).toLocaleString('ko-KR', {
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowCamera(true)}
        className='fixed bottom-10 left-1/2 -translate-x-1/2 z-30 w-fit px-6 h-16 rounded-2xl bg-black text-white shadow-2xl flex flex-row gap-4 items-center justify-center hover:bg-white hover:text-black transition-colors active:scale-95'
        aria-label='카메라로 찍기'>
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
        <span className='text-sm font-medium'>내가 만든 타이폴드 사진찍기</span>
      </button>

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

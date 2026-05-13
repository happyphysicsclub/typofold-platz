'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import BubbleUI from 'react-bubble-ui'
import 'react-bubble-ui/dist/index.css'
import { supabase, Photo } from '@/lib/supabase'
import { CameraCapture } from '@/components/CameraCapture'
import { CaptionModal } from '@/components/CaptionModal'
import { Lightbox } from '@/components/Lightbox'

const NUM_COLS = 5
const GUTTER = 4
const CORNER_RADIUS = 50
const PADDING = 16

function calcBubbleSize(width: number) {
  return Math.floor((width - GUTTER * (NUM_COLS - 1)) / NUM_COLS)
}

function calcXRadius(width: number, bubbleSize: number) {
  return Math.floor(width / 2 - bubbleSize / 2 + (CORNER_RADIUS * (1.414 - 1)) / 1.414)
}

export default function GalleryPage() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [version, setVersion] = useState(0)
  const [showCamera, setShowCamera] = useState(false)
  const [captured, setCaptured] = useState<{ blob: Blob; width: number; height: number } | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [viewportWidth, setViewportWidth] = useState(390)

  useEffect(() => {
    function update() {
      setViewportWidth(window.innerWidth)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const effectiveWidth = viewportWidth - PADDING * 2
  const bubbleSize = calcBubbleSize(effectiveWidth)
  // yRadius ≤ (effectiveWidth/2 - size/2 + cornerRadius*0.293) / 2 ≈ 86
  // keeps row 0 at positive y so it's visible at scrollTop=0
  const bubbleOptions = {
    size: bubbleSize,
    minSize: Math.floor(bubbleSize * 0.7),
    gutter: GUTTER,
    provideProps: false,
    numCols: NUM_COLS,
    fringeWidth: 1000,
    yRadius: 86,
    xRadius: calcXRadius(effectiveWidth, bubbleSize),
    cornerRadius: CORNER_RADIUS,
    compact: true,
    gravitation: 5,
  }

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
    <div className='min-h-screen'>
      {/* Header */}
      <header className='fixed top-0 left-0 z-20 w-full px-3 h-12 flex items-center'>
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
        <div style={{ overflowX: 'hidden', paddingLeft: PADDING, paddingRight: PADDING, paddingTop: 48 }}>
          <BubbleUI options={bubbleOptions} style={{ width: '100%', height: 'calc(100dvh - 48px)' }}>
            {photos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                style={{
                  position: 'relative',
                  width: bubbleSize,
                  height: bubbleSize,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}>
                <Image
                  src={photo.public_url}
                  alt={photo.caption ?? ''}
                  fill
                  sizes={`${bubbleSize}px`}
                  style={{ objectFit: 'cover', transform: 'scale(1.2)' }}
                />
              </div>
            ))}
          </BubbleUI>
        </div>
      )}

      {/* FAB */}
      <div className='fixed bottom-0 left-1/2 -translate-x-1/2 z-30 p-4 w-full px-6 h-fit text-black flex flex-col gap-1 items-center justify-center'>
        <button
          onClick={() => setShowCamera(true)}
          aria-label='카메라로 찍기'
          className='w-14 h-14 rounded-full transition-all flex items-center justify-center border-[1px] cursor-pointer border-black hover:bg-background hover:text-black active:scale-95 bg-black text-white'>
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
        <span className='text-[10px] text-black/25'>© {new Date().getFullYear()} TYPOFOLD</span>
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

'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

interface Props {
  blob: Blob
  width: number
  height: number
  onRetake: () => void
  onUploadComplete: () => void
}

export const CaptionModal = ({ blob, width, height, onRetake, onUploadComplete }: Props) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const url = URL.createObjectURL(blob)
    setBlobUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [blob])

  const handleUpload = async () => {
    setUploading(true)
    setProgress(20)

    const path = `${crypto.randomUUID()}.webp`

    const { error: storageError } = await supabase.storage
      .from('photos')
      .upload(path, blob, { contentType: 'image/webp', cacheControl: '3600', upsert: false })

    if (storageError) {
      setError('업로드 실패: ' + storageError.message)
      setUploading(false)
      return
    }

    setProgress(70)

    const { data: urlData } = supabase.storage.from('photos').getPublicUrl(path)

    const { error: dbError } = await supabase.from('photos').insert({
      storage_path: path,
      public_url: urlData.publicUrl,
      caption: caption.trim() || null,
      width,
      height,
    })

    if (dbError) {
      setError('저장 실패: ' + dbError.message)
      setUploading(false)
      return
    }

    setProgress(100)
    onUploadComplete()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* 미리보기 */}
      <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
        {blobUrl && (
          <Image
            src={blobUrl}
            alt="촬영된 사진"
            width={width}
            height={height}
            className="max-w-full max-h-full object-contain"
            unoptimized
          />
        )}
      </div>

      {/* 하단 입력 영역 */}
      <div className="bg-black px-4 pt-4 pb-8 space-y-3">
        {error && <p className="text-red-400 text-xs">{error}</p>}

        {uploading && (
          <div className="h-0.5 bg-white/10 overflow-hidden">
            <div className="h-full bg-white transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        )}

        <input
          type="text"
          placeholder="캡션 추가 (선택사항)"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="w-full bg-white/10 text-white placeholder-white/40 px-3 py-2.5 text-sm focus:bg-white/15 transition-colors"
          maxLength={200}
          disabled={uploading}
          autoFocus
        />

        <div className="flex gap-2">
          <button
            onClick={onRetake}
            disabled={uploading}
            className="flex-1 border border-white/20 text-white/70 hover:text-white hover:border-white/50 py-3 text-sm disabled:opacity-30 transition-colors"
          >
            다시 찍기
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="flex-1 bg-white text-black py-3 text-sm font-medium disabled:opacity-40 hover:bg-white/90 transition-colors"
          >
            {uploading ? '업로드 중...' : '올리기'}
          </button>
        </div>
      </div>
    </div>
  )
}

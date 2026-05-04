'use client'

import { useState, useRef, DragEvent } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { compressImage } from '@/lib/compressImage'
import { CameraCapture } from '@/components/CameraCapture'

interface UploadModalProps {
  onClose: () => void
  onUploadComplete: () => void
}

export const UploadModal = ({ onClose, onUploadComplete }: UploadModalProps) => {
  const [file, setFile] = useState<File | null>(null)
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null)
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const blobUrlRef = useRef<string | null>(null)

  const handleFile = (selected: File) => {
    if (!selected.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.')
      return
    }
    if (selected.size > 10 * 1024 * 1024) {
      setError('파일 크기는 10MB 이하여야 합니다.')
      return
    }
    setError(null)
    setCapturedBlob(null)
    setFile(selected)
    const reader = new FileReader()
    reader.onloadend = () => {
      const dataUrl = reader.result as string
      setPreview(dataUrl)
      const img = new window.Image()
      img.onload = () => setDimensions({ width: img.naturalWidth, height: img.naturalHeight })
      img.src = dataUrl
    }
    reader.readAsDataURL(selected)
  }

  const handleCameraCapture = (blob: Blob, w: number, h: number) => {
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
    const url = URL.createObjectURL(blob)
    blobUrlRef.current = url
    setFile(null)
    setCapturedBlob(blob)
    setDimensions({ width: w, height: h })
    setPreview(url)
    setError(null)
    setShowCamera(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) handleFile(dropped)
  }

  const handleUpload = async () => {
    if (!file && !capturedBlob) return
    setUploading(true)

    let uploadBlob: Blob
    let finalWidth: number | null = null
    let finalHeight: number | null = null

    if (capturedBlob) {
      uploadBlob = capturedBlob
      finalWidth = dimensions?.width ?? null
      finalHeight = dimensions?.height ?? null
      setStatus('업로드 중...')
      setProgress(30)
    } else {
      setStatus('압축 중...')
      setProgress(10)
      try {
        const result = await compressImage(file!)
        uploadBlob = result.blob
        finalWidth = result.width
        finalHeight = result.height
      } catch {
        uploadBlob = file!
        finalWidth = dimensions?.width ?? null
        finalHeight = dimensions?.height ?? null
      }
      setProgress(35)
      setStatus('업로드 중...')
    }

    const path = `${crypto.randomUUID()}.webp`

    const { error: storageError } = await supabase.storage
      .from('photos')
      .upload(path, uploadBlob, { contentType: 'image/webp', cacheControl: '3600', upsert: false })

    if (storageError) {
      setError('업로드 실패: ' + storageError.message)
      setUploading(false)
      return
    }

    setProgress(75)
    setStatus('저장 중...')

    const { data: urlData } = supabase.storage.from('photos').getPublicUrl(path)

    const { error: dbError } = await supabase.from('photos').insert({
      storage_path: path,
      public_url: urlData.publicUrl,
      caption: caption.trim() || null,
      width: finalWidth,
      height: finalHeight,
    })

    if (dbError) {
      setError('저장 실패: ' + dbError.message)
      setUploading(false)
      return
    }

    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
    setProgress(100)
    onUploadComplete()
  }

  if (showCamera) {
    return <CameraCapture onCapture={handleCameraCapture} onClose={() => setShowCamera(false)} />
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray hover:text-black text-2xl leading-none"
        >
          ×
        </button>

        <h2 className="font-bold text-lg mb-6">사진 올리기</h2>

        <div
          className={`border-2 border-dashed transition-colors relative overflow-hidden mb-4 ${
            preview ? 'border-black/10 cursor-default' : 'cursor-pointer border-black/20 hover:border-black/50'
          } ${isDragging ? 'border-primary bg-primary/5' : ''}`}
          style={{ aspectRatio: '4/3' }}
          onClick={() => !preview && fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          {preview && dimensions ? (
            <>
              <Image
                src={preview}
                alt="미리보기"
                width={dimensions.width}
                height={dimensions.height}
                className="w-full h-full object-contain"
                unoptimized={preview.startsWith('blob:')}
              />
              <button
                onClick={() => {
                  setPreview(null)
                  setFile(null)
                  setCapturedBlob(null)
                  setDimensions(null)
                }}
                className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 hover:bg-black/80 transition-colors"
              >
                다시 선택
              </button>
              {capturedBlob && (
                <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-1 tracking-wide">
                  FISHEYE
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray select-none">
              <span className="text-5xl font-thin">+</span>
              <span className="text-sm">클릭하거나 드래그해서 사진 선택</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowCamera(true)
                }}
                className="text-xs border border-black/25 px-3 py-1.5 hover:border-black/60 hover:text-black transition-colors"
              >
                카메라로 찍기 (어안렌즈)
              </button>
              <span className="text-xs opacity-50">JPG, PNG, WEBP, GIF (최대 10MB)</span>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        <input
          type="text"
          placeholder="캡션 (선택사항)"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="w-full border border-black/20 px-3 py-2 text-sm mb-4 focus:border-black transition-colors bg-transparent"
          maxLength={200}
          disabled={uploading}
        />

        {error && <p className="text-red-500 text-xs mb-4">{error}</p>}

        {uploading && (
          <div className="h-0.5 bg-black/10 mb-4 overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={(!file && !capturedBlob) || uploading}
          className="w-full bg-primary text-white py-3 text-sm font-medium disabled:opacity-40 hover:bg-black transition-colors"
        >
          {uploading ? status : '업로드'}
        </button>
      </div>
    </div>
  )
}

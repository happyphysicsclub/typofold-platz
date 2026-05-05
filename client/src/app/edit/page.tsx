'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase, Photo } from '@/lib/supabase'

const PASSWORD = '0415'

function IconEye() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function IconEyeOff() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function IconTrash() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  )
}

export default function EditPage() {
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState('')
  const [pwError, setPwError] = useState(false)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState<Set<string>>(new Set())
  const [confirmId, setConfirmId] = useState<string | null>(null)

  useEffect(() => {
    if (sessionStorage.getItem('edit-authed') === '1') setAuthed(true)
  }, [])

  useEffect(() => {
    if (!authed) return
    setLoading(true)
    supabase
      .from('photos')
      .select('*')
      .order('uploaded_at', { ascending: false })
      .then(({ data }) => {
        if (data) setPhotos(data as Photo[])
        setLoading(false)
      })
  }, [authed])

  const handleLogin = () => {
    if (pw === PASSWORD) {
      sessionStorage.setItem('edit-authed', '1')
      setAuthed(true)
    } else {
      setPwError(true)
      setPw('')
    }
  }

  const setBusyToggle = (id: string, on: boolean) =>
    setBusy((s) => { const n = new Set(s); on ? n.add(id) : n.delete(id); return n })

  const handleToggleHide = async (photo: Photo) => {
    setBusyToggle(photo.id, true)
    const next = !photo.hidden
    const { error } = await supabase.from('photos').update({ hidden: next }).eq('id', photo.id)
    if (!error) setPhotos((prev) => prev.map((p) => (p.id === photo.id ? { ...p, hidden: next } : p)))
    setBusyToggle(photo.id, false)
  }

  const handleDelete = async (photo: Photo) => {
    setConfirmId(null)
    setBusyToggle(photo.id, true)
    await supabase.storage.from('photos').remove([photo.storage_path])
    await supabase.from('photos').delete().eq('id', photo.id)
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id))
    setBusyToggle(photo.id, false)
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-8">
        <div className="flex flex-col items-center gap-5 w-full max-w-xs">
          <span className="font-bold text-sm tracking-widest uppercase">Edit</span>
          <input
            type="password"
            value={pw}
            onChange={(e) => { setPw(e.target.value); setPwError(false) }}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="비밀번호"
            className={`w-full border-b ${pwError ? 'border-red-400' : 'border-black'} bg-transparent text-center text-lg py-2 focus:outline-none placeholder-black/30`}
            autoFocus
          />
          {pwError && <p className="text-red-400 text-xs">비밀번호가 틀렸습니다</p>}
          <button
            onClick={handleLogin}
            className="w-full bg-black text-white py-3 text-sm font-medium hover:bg-black/80 transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20">
      <header className="h-14 flex items-center justify-between px-4">
        <Link href="/" className="text-xs text-black/40 hover:text-black transition-colors">
          ← 갤러리
        </Link>
        <span className="font-bold text-sm tracking-widest uppercase">Edit</span>
        <span className="text-xs text-black/30 w-16 text-right">{photos.length}장</span>
      </header>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <span className="text-black/30 text-sm animate-pulse">불러오는 중...</span>
        </div>
      ) : photos.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <span className="text-black/30 text-sm">사진이 없습니다</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1 p-1">
          {photos.map((photo) => (
            <div key={photo.id} className="flex flex-col">
              <div className={`relative w-full aspect-square overflow-hidden ${photo.hidden ? 'opacity-40' : ''}`}>
                <img
                  src={photo.public_url}
                  alt={photo.caption ?? ''}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {photo.hidden && (
                  <div className="absolute top-1 left-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 leading-none">
                    숨김
                  </div>
                )}
              </div>

              {confirmId === photo.id ? (
                <div className="flex gap-1 mt-1">
                  <button
                    onClick={() => handleDelete(photo)}
                    className="flex-1 bg-black text-white text-xs py-2 hover:bg-black/70 transition-colors"
                  >
                    삭제
                  </button>
                  <button
                    onClick={() => setConfirmId(null)}
                    className="flex-1 border border-black/20 text-black/50 text-xs py-2 hover:border-black/50 transition-colors"
                  >
                    취소
                  </button>
                </div>
              ) : (
                <div className="flex gap-1 mt-1">
                  <button
                    onClick={() => handleToggleHide(photo)}
                    disabled={busy.has(photo.id)}
                    title={photo.hidden ? '보이기' : '숨기기'}
                    className="flex-1 border border-black/15 text-black/50 py-2 flex items-center justify-center hover:border-black/40 hover:text-black disabled:opacity-30 transition-colors"
                  >
                    {photo.hidden ? <IconEye /> : <IconEyeOff />}
                  </button>
                  <button
                    onClick={() => setConfirmId(photo.id)}
                    disabled={busy.has(photo.id)}
                    title="삭제"
                    className="flex-1 border border-black/15 text-black/50 py-2 flex items-center justify-center hover:border-red-400 hover:text-red-400 disabled:opacity-30 transition-colors"
                  >
                    <IconTrash />
                  </button>
                </div>
              )}

              {photo.caption && (
                <p className="text-[10px] text-black/40 px-0.5 mt-0.5 truncate">{photo.caption}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

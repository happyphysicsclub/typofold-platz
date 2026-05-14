'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
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
  const [direction, setDirection] = useState(0)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && prev) {
        setDirection(-1)
        onNavigate(prev)
      }
      if (e.key === 'ArrowRight' && next) {
        setDirection(1)
        onNavigate(next)
      }
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

  const bubbleVariants = {
    enter: (dir: number) => ({
      x: dir === 0 ? 0 : dir * 140,
      y: dir === 0 ? 120 : 0,
      scale: dir === 0 ? 0.35 : 0.88,
      opacity: 0,
    }),
    center: {
      x: 0,
      y: 0,
      scale: 1,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir === 0 ? 0 : -dir * 140,
      y: dir === 0 ? -80 : 0,
      scale: dir === 0 ? 0.5 : 0.88,
      opacity: 0,
    }),
  }

  return (
    <motion.div
      className='fixed inset-0 z-50 bg-background/30 backdrop-blur-xs flex items-center justify-center overflow-hidden'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      onClick={onClose}>
      <button
        className='absolute top-4 right-4 shadow-2xl bg-background rounded-full w-12 h-12 flex items-center justify-center text-black/75 hover:bg-black hover:text-white transition-all cursor-pointer z-10'
        onClick={onClose}>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          fill='none'
          viewBox='0 0 24 24'
          strokeWidth={1.5}
          stroke='currentColor'
          className='w-6 h-6'>
          <path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' />
        </svg>
      </button>
      <p className='text-black text-center absolute top-4 left-1/2 transform -translate-x-1/2 text-sm z-10  px-3 py-1 rounded-full'>
        {currentIndex + 1} / {photos.length}
      </p>

      {prev && (
        <button
          className='absolute left-3 md:left-6 shadow-2xl cursor-pointer hover:bg-black hover:text-white text-black/75 bg-background rounded-full leading-none text-4xl z-10 w-12 h-12 flex items-center justify-center transition-all'
          onClick={(e) => {
            e.stopPropagation()
            setDirection(-1)
            onNavigate(prev)
          }}>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth={1.5}
            stroke='currentColor'
            className='w-6 h-6'>
            <path strokeLinecap='round' strokeLinejoin='round' d='M15.75 19.5L8.25 12l7.5-7.5' />
          </svg>
        </button>
      )}

      <AnimatePresence mode='wait' custom={direction}>
        <motion.div
          key={currentPhoto.id}
          className='max-w-5xl w-full max-h-[90vh] px-16 flex flex-col items-center'
          onClick={(e) => e.stopPropagation()}
          custom={direction}
          variants={bubbleVariants}
          initial='enter'
          animate='center'
          exit='exit'
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 22,
          }}>
          <motion.div
            className='max-h-[80vh] max-w-full object-contain rounded-full overflow-hidden'
            style={{ filter: 'drop-shadow(0 24px 48px rgba(255,255,255,0.07))' }}
            animate={{ y: [0, -14, 0] }}
            transition={{
              y: {
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.4,
              },
            }}>
            <img
              src={currentPhoto.public_url}
              alt={currentPhoto.caption || ''}
              className='w-full h-full object-contain rounded-full scale-110 transition-transform'
            />
          </motion.div>
          <div className='w-fit h-fit flex flex-col gap-3 rounded-xl shadow-2xl bg-background mt-6 px-5 py-4'>
            {currentPhoto.caption && <p className='text-black text-lg text-center max-w-lg'>{currentPhoto.caption}</p>}
            <p className='text-black font-mono text-sm mt-1'>
              {new Date(currentPhoto.uploaded_at).toLocaleString('en-US')}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      {next && (
        <button
          className='absolute right-3 md:right-6 shadow-2xl cursor-pointer hover:bg-black hover:text-white text-black/75 bg-background rounded-full leading-none text-4xl z-10 w-12 h-12 flex items-center justify-center transition-all'
          onClick={(e) => {
            e.stopPropagation()
            setDirection(1)
            onNavigate(next)
          }}>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth={1.5}
            stroke='currentColor'
            className='w-6 h-6'>
            <path strokeLinecap='round' strokeLinejoin='round' d='M8.25 4.5l7.5 7.5-7.5 7.5' />
          </svg>
        </button>
      )}
    </motion.div>
  )
}

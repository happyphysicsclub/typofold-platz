import { Spinner } from '@/components'

export default function Loading() {
  return (
    <div className='min-h-screen flex flex-col gap-4 items-center justify-center'>
      <Spinner />
      <p className='text-gray/50 text-sm'>사진을 불러오는 중입니다...</p>
    </div>
  )
}

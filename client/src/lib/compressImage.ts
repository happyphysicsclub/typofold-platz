const MAX_DIMENSION = 1920
const WEBP_QUALITY = 0.85

// JPEG 파일에서 EXIF orientation 태그(0x0112)를 직접 파싱
async function readExifOrientation(file: File): Promise<number> {
  if (!file.type.includes('jpeg') && !file.type.includes('jpg')) return 1

  try {
    const buffer = await file.slice(0, 65536).arrayBuffer()
    const view = new DataView(buffer)

    if (view.getUint16(0) !== 0xffd8) return 1

    let offset = 2
    while (offset < view.byteLength - 4) {
      const marker = view.getUint16(offset)
      offset += 2

      if (marker === 0xffe1) {
        const length = view.getUint16(offset)
        offset += 2

        const isExif =
          view.getUint32(offset) === 0x45786966 && view.getUint16(offset + 4) === 0x0000
        if (isExif) {
          const tiffOffset = offset + 6
          const le = view.getUint16(tiffOffset) === 0x4949
          const ifdOffset = tiffOffset + view.getUint32(tiffOffset + 4, le)
          const entryCount = view.getUint16(ifdOffset, le)

          for (let i = 0; i < entryCount; i++) {
            const entryOffset = ifdOffset + 2 + i * 12
            if (view.getUint16(entryOffset, le) === 0x0112) {
              return view.getUint16(entryOffset + 8, le)
            }
          }
        }
        offset += length - 2
      } else if ((marker & 0xff00) === 0xff00) {
        offset += view.getUint16(offset)
      } else {
        break
      }
    }
  } catch {
    // EXIF 파싱 실패 시 회전 없음으로 처리
  }

  return 1
}

export async function compressImage(
  file: File,
): Promise<{ blob: Blob; width: number; height: number }> {
  const orientation = await readExifOrientation(file)
  // orientation 6 = 90°CW, 8 = 90°CCW → 캔버스 가로/세로 교환 필요
  const isRotated = orientation === 6 || orientation === 8

  return new Promise((resolve, reject) => {
    const img = new window.Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      const srcW = img.naturalWidth
      const srcH = img.naturalHeight

      // 회전 후 실제 표시 크기 (논리적 너비/높이)
      const logW = isRotated ? srcH : srcW
      const logH = isRotated ? srcW : srcH

      // MAX_DIMENSION 기준으로 비율 유지 축소
      let outW = logW
      let outH = logH

      if (outW > MAX_DIMENSION || outH > MAX_DIMENSION) {
        if (outW >= outH) {
          outH = Math.round((outH / outW) * MAX_DIMENSION)
          outW = MAX_DIMENSION
        } else {
          outW = Math.round((outW / outH) * MAX_DIMENSION)
          outH = MAX_DIMENSION
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = outW
      canvas.height = outH

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas not supported'))
        return
      }

      ctx.save()
      if (orientation === 3) {
        // 180°
        ctx.translate(outW, outH)
        ctx.rotate(Math.PI)
        ctx.drawImage(img, 0, 0, outW, outH)
      } else if (orientation === 6) {
        // 90° CW: 원본을 시계방향 90° 회전
        ctx.translate(outW, 0)
        ctx.rotate(Math.PI / 2)
        ctx.drawImage(img, 0, 0, outH, outW)
      } else if (orientation === 8) {
        // 90° CCW: 원본을 반시계방향 90° 회전
        ctx.translate(0, outH)
        ctx.rotate(-Math.PI / 2)
        ctx.drawImage(img, 0, 0, outH, outW)
      } else {
        ctx.drawImage(img, 0, 0, outW, outH)
      }
      ctx.restore()

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Compression failed'))
            return
          }
          resolve({ blob, width: outW, height: outH })
        },
        'image/webp',
        WEBP_QUALITY,
      )
    }

    img.onerror = () => reject(new Error('Image load failed'))
    img.src = objectUrl
  })
}

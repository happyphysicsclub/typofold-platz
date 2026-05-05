'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  onCapture: (blob: Blob, width: number, height: number) => void
  onClose: () => void
}

const VS = `
attribute vec2 a_pos;
attribute vec2 a_uv;
varying vec2 v_uv;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
  v_uv = a_uv;
}`

const FS = `
precision mediump float;
uniform sampler2D u_tex;
uniform float u_strength;
uniform float u_aspect;
uniform float u_mirror;
varying vec2 v_uv;

void main() {
  vec2 uv = v_uv * 2.0 - 1.0;

  if (u_mirror > 0.5) uv.x = -uv.x;
  uv.x *= u_aspect;
  float r = length(uv);

  float r_src = r * (1.0 + u_strength * r * r);
  vec2 src = (r > 0.001) ? uv * (r_src / r) : uv;
  src.x /= u_aspect;
  src = clamp(src * 0.5 + 0.5, 0.0, 1.0);

  gl_FragColor = texture2D(u_tex, src);
}`

function initGL(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true })
  if (!gl) throw new Error('no webgl')

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? '')
    return s
  }
  const prog = gl.createProgram()!
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS))
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS))
  gl.linkProgram(prog)
  gl.useProgram(prog)

  const bindBuf = (data: Float32Array, attr: string, size: number) => {
    const buf = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, attr)
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0)
  }
  bindBuf(new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), 'a_pos', 2)
  bindBuf(new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), 'a_uv', 2)

  const tex = gl.createTexture()!
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

  const u = (name: string) => gl.getUniformLocation(prog, name)!
  gl.uniform1f(u('u_strength'), 0.55)
  gl.uniform1f(u('u_aspect'), 16 / 9)
  gl.uniform1f(u('u_mirror'), 0)

  return { gl, tex, uAspect: u('u_aspect'), uMirror: u('u_mirror') }
}

export const CameraCapture = ({ onCapture, onClose }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const glRef = useRef<ReturnType<typeof initGL> | null>(null)
  const rafRef = useRef<number>(0)
  const streamRef = useRef<MediaStream | null>(null)
  const facingRef = useRef<'user' | 'environment'>('environment')
  const [ready, setReady] = useState(false)
  const [flash, setFlash] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startCamera = async (facing: 'user' | 'environment') => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    setError(null)

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('HTTPS 환경에서만 카메라를 사용할 수 있습니다.\nlocalhost 또는 https:// 주소로 접속해주세요.')
      return
    }

    // 제약 조건을 단계적으로 완화하며 시도
    const attempts: MediaStreamConstraints[] = [
      { video: { facingMode: { ideal: facing } }, audio: false },
      { video: { facingMode: { ideal: facing === 'environment' ? 'user' : 'environment' } }, audio: false },
      { video: true, audio: false },
    ]

    let stream: MediaStream | null = null
    let lastErr: DOMException | null = null

    for (const constraints of attempts) {
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints)
        break
      } catch (e) {
        lastErr = e as DOMException
        // 권한 거부는 재시도해도 소용없으므로 즉시 중단
        if (lastErr.name === 'NotAllowedError' || lastErr.name === 'PermissionDeniedError') break
      }
    }

    if (!stream) {
      const err = lastErr!
      console.error('[Camera]', err.name, err.message)
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('카메라 권한이 거부되어 있습니다.\n브라우저 주소창 왼쪽 🔒 아이콘 → 카메라 → 허용 후 새로고침해주세요.')
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('카메라를 찾을 수 없습니다.\n기기에 카메라가 연결되어 있는지 확인해주세요.')
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('카메라가 다른 앱에서 사용 중입니다.\n다른 앱을 닫고 다시 시도해주세요.')
      } else {
        setError(`카메라를 시작할 수 없습니다. (${err.name})`)
      }
      return
    }

    streamRef.current = stream
    facingRef.current = facing
    const video = videoRef.current!
    video.pause()
    video.srcObject = stream
    try {
      await video.play()
    } catch (e) {
      if ((e as DOMException).name !== 'AbortError') throw e
    }
    setReady(true)
  }

  useEffect(() => {
    const canvas = canvasRef.current!
    const video = videoRef.current!
    let active = true

    async function setup() {
      try {
        glRef.current = initGL(canvas)
      } catch {
        if (active) setError('WebGL을 지원하지 않는 브라우저입니다.')
        return
      }
      if (active) await startCamera('environment')
    }

    setup()

    const render = () => {
      rafRef.current = requestAnimationFrame(render)
      const g = glRef.current
      if (!g || video.readyState < 2) return
      const { gl, tex, uAspect, uMirror } = g

      const vw = video.videoWidth
      const vh = video.videoHeight
      if (!vw || !vh) return

      if (canvas.width !== vw || canvas.height !== vh) {
        canvas.width = vw
        canvas.height = vh
        gl.viewport(0, 0, vw, vh)
      }

      gl.uniform1f(uAspect, vw / vh)
      gl.uniform1f(uMirror, facingRef.current === 'user' ? 1.0 : 0.0)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }

    rafRef.current = requestAnimationFrame(render)

    return () => {
      active = false
      cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const handleFlip = () => startCamera(facingRef.current === 'environment' ? 'user' : 'environment')

  const handleCapture = () => {
    setFlash(true)
    setTimeout(() => setFlash(false), 250)

    const src = canvasRef.current!
    const minDim = Math.min(src.width, src.height)
    const cx = Math.round((src.width - minDim) / 2)
    const cy = Math.round((src.height - minDim) / 2)

    const tmp = document.createElement('canvas')
    tmp.width = minDim
    tmp.height = minDim
    const ctx = tmp.getContext('2d')!
    ctx.drawImage(src, cx, cy, minDim, minDim, 0, 0, minDim, minDim)

    const r = minDim / 2
    const grad = ctx.createRadialGradient(r, r, r * 0.82, r, r, r)
    grad.addColorStop(0, 'rgba(0,0,0,0)')
    grad.addColorStop(0.55, 'rgba(0,0,0,0.55)')
    grad.addColorStop(1.0, 'rgba(0,0,0,1)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, minDim, minDim)

    tmp.toBlob((blob) => {
      if (blob) onCapture(blob, minDim, minDim)
    }, 'image/webp', 0.92)
  }

  return (
    <div className="fixed inset-0 z-60 overflow-hidden bg-black select-none">
      {/* 전체화면 캔버스: CSS cover 트릭으로 화면을 꽉 채움 */}
      <video ref={videoRef} className="hidden" playsInline muted />
      <canvas
        ref={canvasRef}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ minWidth: '100%', minHeight: '100%', width: 'auto', height: 'auto' }}
      />

      {/* 원형 비네팅 오버레이 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle closest-side at 50% 50%, transparent 0%, transparent 82%, rgba(0,0,0,0.55) 91%, rgba(0,0,0,1) 100%)',
          zIndex: 2,
        }}
      />

      {/* 셔터 플래시 */}
      <div
        className="absolute inset-0 z-10 bg-white pointer-events-none transition-opacity duration-200"
        style={{ opacity: flash ? 1 : 0 }}
      />

      {/* 에러 */}
      {error && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 px-8">
          <p className="text-white/70 text-sm text-center whitespace-pre-line leading-relaxed">{error}</p>
          <button
            onClick={() => startCamera(facingRef.current)}
            className="text-xs border border-white/30 text-white/60 hover:text-white hover:border-white/60 px-4 py-2 transition-colors"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* 상단 버튼 */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-4">
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center text-white/70 hover:text-white text-2xl"
        >
          ×
        </button>
        <button
          onClick={handleFlip}
          className="w-10 h-10 flex items-center justify-center text-white/70 hover:text-white text-xl"
        >
          ↺
        </button>
      </div>

      {/* 셔터 버튼 */}
      <div className="absolute bottom-0 left-0 right-0 z-20 h-28 flex items-center justify-center">
        <button
          onClick={handleCapture}
          disabled={!ready}
          className="w-18 h-18 rounded-full border-[3px] border-white/70 disabled:opacity-30 active:scale-95 transition-transform flex items-center justify-center"
        >
          <div className="w-14 h-14 rounded-full bg-white" />
        </button>
      </div>
    </div>
  )
}

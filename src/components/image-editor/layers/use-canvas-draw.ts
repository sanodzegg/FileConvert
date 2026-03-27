import { useEffect, useCallback, type RefObject, type MutableRefObject } from 'react'
import type { Adjustments, Transform } from '../toolbar/types'
import type { ResizeState } from '../utils/resize-presets'
import type { OverlayMode } from '../toolbar/tab-overlay'
import type { ScaleInfo } from '../utils/image-space'
import { buildFilter, applyBlur, applySharpen, applyVignette } from '../utils/canvas-filters'
import { imageToCanvas, canvasToImage } from '../utils/image-space'
import { renderCommand } from './use-draw-commands'
import { scaleCommand } from '../utils/draw-command-transform'
import type { useTextOverlays } from './use-text-overlays'
import type { useDrawCommands } from './use-draw-commands'

interface Rect { x: number; y: number; w: number; h: number }

const INSET = 12

interface UseCanvasDrawParams {
  file: File
  canvasRef: RefObject<HTMLCanvasElement | null>
  ctxRef: MutableRefObject<CanvasRenderingContext2D | null>
  containerRef: RefObject<HTMLDivElement | null>
  imgRef: MutableRefObject<HTMLImageElement | null>
  scaleRef: MutableRefObject<ScaleInfo>
  cropRef: MutableRefObject<Rect>
  adjustmentsRef: MutableRefObject<Adjustments>
  transformRef: MutableRefObject<Transform>
  modeRef: MutableRefObject<OverlayMode>
  textLayerRef: MutableRefObject<ReturnType<typeof useTextOverlays>>
  drawLayerRef: MutableRefObject<ReturnType<typeof useDrawCommands>>
  // Redraw triggers (React state that changes when overlays change)
  crop: Rect
  adjustments: Adjustments
  transform: Transform
  textOverlaysDep: unknown
  drawCommandsDep: unknown
  mode: OverlayMode
  setCrop: (r: Rect) => void
  setResize: (fn: (prev: ResizeState) => ResizeState) => void
  setImgLoaded: (v: boolean) => void
}

export function useCanvasDraw({
  file,
  canvasRef, ctxRef, containerRef, imgRef, scaleRef,
  cropRef, adjustmentsRef, transformRef, modeRef,
  textLayerRef, drawLayerRef,
  crop, adjustments, transform, textOverlaysDep, drawCommandsDep, mode,
  setCrop, setResize, setImgLoaded,
}: UseCanvasDrawParams) {
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = ctxRef.current
    const img = imgRef.current
    if (!canvas || !ctx || !img) return
    const scale = scaleRef.current
    const { offX, offY, dispW, dispH } = scale
    const c = cropRef.current
    const a = adjustmentsRef.current
    const t = transformRef.current
    const cssW = canvas.width / (window.devicePixelRatio || 1)
    const cssH = canvas.height / (window.devicePixelRatio || 1)
    ctx.clearRect(0, 0, cssW, cssH)

    const cx_img = offX + dispW / 2
    const cy_img = offY + dispH / 2

    if (a.blur > 0 || a.sharpen > 0) {
      const offscreen = document.createElement('canvas')
      offscreen.width = cssW
      offscreen.height = cssH
      const octx = offscreen.getContext('2d')!
      octx.imageSmoothingEnabled = true
      octx.imageSmoothingQuality = 'high'
      octx.filter = buildFilter(a)
      octx.save()
      octx.translate(cx_img, cy_img)
      octx.rotate((t.rotation * Math.PI) / 180)
      octx.scale(t.flipH ? -1 : 1, t.flipV ? -1 : 1)
      octx.translate(-cx_img, -cy_img)
      octx.drawImage(img, offX, offY, dispW, dispH)
      octx.restore()
      octx.filter = 'none'
      const blurred = a.blur > 0 ? applyBlur(offscreen, a.blur) : offscreen
      const sharpened = a.sharpen > 0 ? applySharpen(blurred, a.sharpen) : blurred
      ctx.drawImage(sharpened, 0, 0)
    } else {
      ctx.save()
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.filter = buildFilter(a)
      ctx.translate(cx_img, cy_img)
      ctx.rotate((t.rotation * Math.PI) / 180)
      ctx.scale(t.flipH ? -1 : 1, t.flipV ? -1 : 1)
      ctx.translate(-cx_img, -cy_img)
      ctx.drawImage(img, offX, offY, dispW, dispH)
      ctx.restore()
      ctx.filter = 'none'
    }

    applyVignette(ctx, offX, offY, dispW, dispH, a.vignette)

    // Text overlays
    const tl = textLayerRef.current
    for (const ov of tl.overlays) {
      const { x: cx, y: cy } = imageToCanvas(ov.x, ov.y, scale)
      const displayFontSize = ov.fontSize * scale.x
      ctx.save()
      ctx.font = `${displayFontSize}px ${ov.fontFamily}`
      ctx.fillStyle = ov.color
      ctx.textBaseline = 'top'
      if (ov.id === tl.selectedId) {
        const metrics = ctx.measureText(ov.content)
        ctx.strokeStyle = 'rgba(255,255,255,0.6)'
        ctx.lineWidth = 1
        ctx.strokeRect(cx - 2, cy - 2, metrics.width + 4, displayFontSize + 4)
      }
      ctx.fillText(ov.content, cx, cy)
      ctx.restore()
    }

    // Draw commands
    const dl = drawLayerRef.current
    const activStroke = dl.currentRef.current
    for (const cmd of [...dl.commands, ...(activStroke ? [activStroke] : [])]) {
      renderCommand(ctx, scaleCommand(cmd, scale))
    }

    // Crop overlay UI (only in crop mode)
    if (modeRef.current === 'crop') {
      const sx = scale.x
      const sy = scale.y
      const cropX = offX + c.x * sx
      const cropY = offY + c.y * sy
      const cropW = c.w * sx
      const cropH = c.h * sy
      const HANDLE_SIZE = 10

      ctx.fillStyle = 'rgba(0,0,0,0.45)'
      ctx.fillRect(offX, offY, dispW, cropY - offY)
      ctx.fillRect(offX, cropY + cropH, dispW, offY + dispH - cropY - cropH)
      ctx.fillRect(offX, cropY, cropX - offX, cropH)
      ctx.fillRect(cropX + cropW, cropY, offX + dispW - cropX - cropW, cropH)

      ctx.strokeStyle = 'white'
      ctx.lineWidth = 1.5
      ctx.strokeRect(cropX, cropY, cropW, cropH)

      ctx.strokeStyle = 'rgba(255,255,255,0.25)'
      ctx.lineWidth = 0.5
      for (let i = 1; i <= 2; i++) {
        ctx.beginPath(); ctx.moveTo(cropX + cropW * i / 3, cropY); ctx.lineTo(cropX + cropW * i / 3, cropY + cropH); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(cropX, cropY + cropH * i / 3); ctx.lineTo(cropX + cropW, cropY + cropH * i / 3); ctx.stroke()
      }

      ctx.fillStyle = 'white'
      const hs = HANDLE_SIZE
      for (const [hx, hy] of [
        [cropX - hs / 2, cropY - hs / 2],
        [cropX + cropW - hs / 2, cropY - hs / 2],
        [cropX - hs / 2, cropY + cropH - hs / 2],
        [cropX + cropW - hs / 2, cropY + cropH - hs / 2],
      ]) {
        ctx.beginPath(); ctx.roundRect(hx, hy, hs, hs, 2); ctx.fill()
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const initCanvas = useCallback((img: HTMLImageElement) => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const maxW = container.clientWidth
    const scale = Math.min(
      (maxW - INSET * 2) / img.naturalWidth,
      (window.innerHeight * 0.7 - INSET * 2) / img.naturalHeight
    )
    const dispW = img.naturalWidth * scale
    const dispH = img.naturalHeight * scale
    const canvasW = dispW + INSET * 2
    const canvasH = dispH + INSET * 2

    const dpr = window.devicePixelRatio || 1
    canvas.width = canvasW * dpr
    canvas.height = canvasH * dpr
    canvas.style.width = `${canvasW}px`
    canvas.style.height = `${canvasH}px`
    const ctx = canvas.getContext('2d')!
    ctx.scale(dpr, dpr)
    ctxRef.current = ctx

    scaleRef.current = { x: scale, y: scale, offX: INSET, offY: INSET, dispW, dispH }

    const initial: Rect = { x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight }
    cropRef.current = initial
    setCrop(initial)
    setResize(r => ({ ...r, w: img.naturalWidth, h: img.naturalHeight }))
    draw()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draw])

  // File load
  useEffect(() => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { imgRef.current = img; initCanvas(img); setImgLoaded(true) }
    img.src = url
    return () => URL.revokeObjectURL(url)
  }, [file, initCanvas, imgRef, setImgLoaded])

  // Redraw on state changes
  useEffect(() => { draw() }, [crop, adjustments, transform, draw, textOverlaysDep, mode])
  useEffect(() => { draw() }, [drawCommandsDep, draw])

  // Expose canvasToImage for external use (crop interaction needs it via scaleRef directly)
  void canvasToImage

  return { draw, initCanvas }
}

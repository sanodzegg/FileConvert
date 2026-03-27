import { useEffect, type RefObject, type MutableRefObject } from 'react'
import type { OverlayMode } from '../toolbar/tab-overlay'
import type { ScaleInfo } from '../utils/image-space'
import { canvasToImage, imageToCanvas } from '../utils/image-space'
import type { useTextOverlays } from './use-text-overlays'
import type { useDrawCommands, DrawTool } from './use-draw-commands'
import type { useEditorHistory, EditorSnapshot } from './use-editor-history'

interface Rect { x: number; y: number; w: number; h: number }
type CropHandle = 'tl' | 'tr' | 'bl' | 'br' | 'move' | null

const MIN_SIZE = 20
const HANDLE_SIZE = 10

interface DragState {
  handle: CropHandle
  startX: number
  startY: number
  origCrop: Rect
  snapshotAtStart: EditorSnapshot
}

interface TextDragState {
  id: string
  startX: number
  startY: number
  origX: number
  origY: number
  snapshotAtStart: EditorSnapshot
}

interface UseCropInteractionParams {
  canvasRef: RefObject<HTMLCanvasElement | null>
  scaleRef: MutableRefObject<ScaleInfo>
  imgRef: MutableRefObject<HTMLImageElement | null>
  cropRef: MutableRefObject<Rect>
  modeRef: MutableRefObject<OverlayMode>
  drawToolRef: MutableRefObject<DrawTool>
  drawColorRef: MutableRefObject<string>
  drawWidthRef: MutableRefObject<number>
  textLayerRef: MutableRefObject<ReturnType<typeof useTextOverlays>>
  drawLayerRef: MutableRefObject<ReturnType<typeof useDrawCommands>>
  dragRef: MutableRefObject<DragState | null>
  textDragRef: MutableRefObject<TextDragState | null>
  isDrawingRef: MutableRefObject<boolean>
  history: ReturnType<typeof useEditorHistory>
  getSnapshot: () => EditorSnapshot
  setCrop: (r: Rect) => void
  draw: () => void
}

export type { DragState, TextDragState }

export function useCropInteraction({
  canvasRef, scaleRef, imgRef, cropRef,
  modeRef, drawToolRef, drawColorRef, drawWidthRef,
  textLayerRef, drawLayerRef,
  dragRef, textDragRef, isDrawingRef,
  history, getSnapshot, setCrop, draw,
}: UseCropInteractionParams) {
  function canvasCoords(e: React.MouseEvent | MouseEvent) {
    const rect = canvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function getHandle(ex: number, ey: number): CropHandle {
    const { offX, offY, x: sx, y: sy } = scaleRef.current
    const c = cropRef.current
    const cx = offX + c.x * sx, cy = offY + c.y * sy
    const cw = c.w * sx, ch = c.h * sy
    const hs = HANDLE_SIZE + 4
    const near = (px: number, py: number) => Math.abs(ex - px) < hs && Math.abs(ey - py) < hs
    if (near(cx, cy)) return 'tl'
    if (near(cx + cw, cy)) return 'tr'
    if (near(cx, cy + ch)) return 'bl'
    if (near(cx + cw, cy + ch)) return 'br'
    if (ex > cx && ex < cx + cw && ey > cy && ey < cy + ch) return 'move'
    return null
  }

  function clampCrop(r: Rect): Rect {
    const img = imgRef.current!
    const x = Math.max(0, Math.min(r.x, img.naturalWidth - MIN_SIZE))
    const y = Math.max(0, Math.min(r.y, img.naturalHeight - MIN_SIZE))
    const w = Math.max(MIN_SIZE, Math.min(r.w, img.naturalWidth - x))
    const h = Math.max(MIN_SIZE, Math.min(r.h, img.naturalHeight - y))
    return { x, y, w, h }
  }

  function onMouseDown(e: React.MouseEvent) {
    const { x, y } = canvasCoords(e)
    const currentMode = modeRef.current

    if (currentMode === 'crop') {
      const handle = getHandle(x, y)
      if (!handle) return
      dragRef.current = { handle, startX: x, startY: y, origCrop: { ...cropRef.current }, snapshotAtStart: getSnapshot() }
      return
    }
    if (currentMode === 'text') {
      const imgPos = canvasToImage(x, y, scaleRef.current)
      const tl = textLayerRef.current
      const sc = scaleRef.current
      const hit = tl.overlays.find(ov => {
        const { x: cx, y: cy } = imageToCanvas(ov.x, ov.y, sc)
        const displayFontSize = ov.fontSize * sc.x
        const approxW = ov.content.length * displayFontSize * 0.6
        return x >= cx - 4 && x <= cx + approxW + 4 && y >= cy - 4 && y <= cy + displayFontSize + 4
      })
      if (hit) {
        tl.setSelectedId(hit.id)
        textDragRef.current = { id: hit.id, startX: x, startY: y, origX: hit.x, origY: hit.y, snapshotAtStart: getSnapshot() }
      } else {
        history.push(getSnapshot())
        tl.add(imgPos.x, imgPos.y)
      }
      return
    }
    if (currentMode === 'draw') {
      const imgPos = canvasToImage(x, y, scaleRef.current)
      drawLayerRef.current.startStroke(drawToolRef.current, imgPos, drawColorRef.current, drawWidthRef.current)
      isDrawingRef.current = true
    }
  }

  function getCursor(e: React.MouseEvent): string {
    const currentMode = modeRef.current
    if (currentMode === 'text') {
      const { x, y } = canvasCoords(e)
      const sc = scaleRef.current
      const hit = textLayerRef.current.overlays.find(ov => {
        const { x: cx, y: cy } = imageToCanvas(ov.x, ov.y, sc)
        const displayFontSize = ov.fontSize * sc.x
        const approxW = ov.content.length * displayFontSize * 0.6
        return x >= cx - 4 && x <= cx + approxW + 4 && y >= cy - 4 && y <= cy + displayFontSize + 4
      })
      return hit ? 'move' : 'text'
    }
    if (currentMode === 'draw') return 'crosshair'
    const { x, y } = canvasCoords(e)
    const handle = getHandle(x, y)
    const map: Record<string, string> = { tl: 'nwse-resize', br: 'nwse-resize', tr: 'nesw-resize', bl: 'nesw-resize', move: 'move' }
    return map[handle ?? ''] ?? 'default'
  }

  // Global mouse move + up listeners
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!canvasRef.current) return
      const { x, y } = canvasCoords(e)
      const currentMode = modeRef.current

      if (currentMode === 'crop' && dragRef.current) {
        const { handle, startX, startY, origCrop } = dragRef.current
        const dx = (x - startX) / scaleRef.current.x
        const dy = (y - startY) / scaleRef.current.y
        let { x: cx, y: cy, w: cw, h: ch } = origCrop
        if (handle === 'move') { cx += dx; cy += dy }
        else {
          if (handle === 'tl') { cx += dx; cy += dy; cw -= dx; ch -= dy }
          if (handle === 'tr') { cy += dy; cw += dx; ch -= dy }
          if (handle === 'bl') { cx += dx; cw -= dx; ch += dy }
          if (handle === 'br') { cw += dx; ch += dy }
        }
        setCrop(clampCrop({ x: cx, y: cy, w: cw, h: ch }))
        return
      }
      if (currentMode === 'text' && textDragRef.current) {
        const td = textDragRef.current
        const sc = scaleRef.current
        const dx = (x - td.startX) / sc.x
        const dy = (y - td.startY) / sc.y
        textLayerRef.current.update(td.id, { x: td.origX + dx, y: td.origY + dy })
        return
      }
      if (currentMode === 'draw' && isDrawingRef.current) {
        const imgPos = canvasToImage(x, y, scaleRef.current)
        drawLayerRef.current.continueStroke(imgPos)
        draw()
      }
    }

    const onUp = () => {
      if (dragRef.current) history.push(dragRef.current.snapshotAtStart)
      dragRef.current = null
      if (textDragRef.current) history.push(textDragRef.current.snapshotAtStart)
      textDragRef.current = null
      if (modeRef.current === 'draw' && isDrawingRef.current) {
        isDrawingRef.current = false
        history.push(getSnapshot())
        drawLayerRef.current.endStroke()
      }
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draw])

  return { onMouseDown, getCursor }
}

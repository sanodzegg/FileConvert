import { useEffect, useCallback, type MutableRefObject } from 'react'
import type { Adjustments, Transform } from '../toolbar/types'
import type { useEditorHistory, EditorSnapshot } from './use-editor-history'
import type { useDrawCommands } from './use-draw-commands'
import type { useTextOverlays, TextOverlay } from './use-text-overlays'

interface Rect { x: number; y: number; w: number; h: number }

interface UseUndoRedoParams {
  history: ReturnType<typeof useEditorHistory>
  getSnapshot: () => EditorSnapshot
  cropRef: MutableRefObject<Rect>
  setCrop: (r: Rect) => void
  setAdjustments: (a: Adjustments) => void
  adjustmentsRef: MutableRefObject<Adjustments>
  setTransform: (t: Transform) => void
  drawLayer: ReturnType<typeof useDrawCommands>
  textLayer: ReturnType<typeof useTextOverlays>
}

export function useUndoRedo({
  history, getSnapshot,
  cropRef, setCrop,
  setAdjustments, adjustmentsRef,
  setTransform,
  drawLayer, textLayer,
}: UseUndoRedoParams) {
  const applySnapshot = useCallback((snap: EditorSnapshot) => {
    setCrop(snap.crop)
    cropRef.current = snap.crop
    setAdjustments(snap.adjustments)
    adjustmentsRef.current = snap.adjustments
    setTransform(snap.transform)
    drawLayer.setCommands(snap.drawCommands)
    textLayer.setOverlays(snap.textOverlays)
  }, [setCrop, cropRef, setAdjustments, adjustmentsRef, setTransform, drawLayer, textLayer])

  const handleUndo = useCallback(() => {
    const snap = history.undo()
    if (snap) {
      history.pushRedo(getSnapshot())
      applySnapshot(snap)
    }
  }, [history, getSnapshot, applySnapshot])

  const handleRedo = useCallback(() => {
    const snap = history.redo(getSnapshot())
    if (snap) applySnapshot(snap)
  }, [history, getSnapshot, applySnapshot])

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return
      if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); handleUndo() }
      if ((e.key === 'z' && e.shiftKey) || e.key === 'y') { e.preventDefault(); handleRedo() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleUndo, handleRedo])

  const handlePushHistory = useCallback(() => {
    history.push(getSnapshot())
  }, [history, getSnapshot])

  const handleSetAdjustmentsLive = useCallback((a: Adjustments) => {
    setAdjustments(a)
    adjustmentsRef.current = a
  }, [setAdjustments, adjustmentsRef])

  const handleSetAdjustments = useCallback((a: Adjustments) => {
    history.push(getSnapshot())
    setAdjustments(a)
    adjustmentsRef.current = a
  }, [history, getSnapshot, setAdjustments, adjustmentsRef])

  const handleSetTransform = useCallback((t: Transform) => {
    history.push(getSnapshot())
    setTransform(t)
  }, [history, getSnapshot, setTransform])

  const handleDeleteText = useCallback((id: string) => {
    history.push(getSnapshot())
    textLayer.remove(id)
  }, [history, getSnapshot, textLayer])

  const handleUpdateText = useCallback((id: string, patch: Partial<TextOverlay>) => {
    history.push(getSnapshot())
    textLayer.update(id, patch)
  }, [history, getSnapshot, textLayer])

  return {
    handleUndo,
    handleRedo,
    handlePushHistory,
    handleSetAdjustments,
    handleSetAdjustmentsLive,
    handleSetTransform,
    handleDeleteText,
    handleUpdateText,
  }
}

import { useState, useRef, type MutableRefObject } from 'react'

type BgRemoveStatus = 'idle' | 'loading' | 'done' | 'error'

interface UseBgRemoveParams {
  imgRef: MutableRefObject<HTMLImageElement | null>
  initCanvas: (img: HTMLImageElement) => void
}

export function useBgRemove({ imgRef, initCanvas }: UseBgRemoveParams) {
  const [bgRemoveStatus, setBgRemoveStatus] = useState<BgRemoveStatus>('idle')
  const [bgRemoveProgress, setBgRemoveProgress] = useState(0)
  const cancelledRef = useRef(false)

  const handleBgRemove = async () => {
    const img = imgRef.current
    if (!img) return
    cancelledRef.current = false
    setBgRemoveStatus('loading')
    setBgRemoveProgress(0)
    try {
      const { removeBackground } = await import('@imgly/background-removal')
      const res = await fetch(img.src)
      const inputBlob = await res.blob()
      const resultBlob = await removeBackground(inputBlob, {
        progress: (_key: string, current: number, total: number) => {
          if (cancelledRef.current) return
          setBgRemoveProgress(total > 0 ? Math.round((current / total) * 100) : 0)
        },
      })
      if (cancelledRef.current) return
      const url = URL.createObjectURL(resultBlob)
      const newImg = new Image()
      newImg.onload = () => {
        if (cancelledRef.current) { URL.revokeObjectURL(url); return }
        imgRef.current = newImg
        initCanvas(newImg)
        setBgRemoveStatus('done')
        setBgRemoveProgress(100)
      }
      newImg.src = url
    } catch {
      if (!cancelledRef.current) setBgRemoveStatus('error')
    }
  }

  const handleBgRemoveCancel = () => {
    cancelledRef.current = true
    setBgRemoveStatus('idle')
    setBgRemoveProgress(0)
  }

  return { bgRemoveStatus, bgRemoveProgress, handleBgRemove, handleBgRemoveCancel }
}

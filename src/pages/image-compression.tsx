import { useState, useRef, lazy } from 'react'
import { Import, RotateCcw, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const ComparisonSlider = lazy(() => import('@/components/settings/comparison-slider'))

const FORMATS = [
  { id: 'jpeg', label: 'JPEG' },
  { id: 'webp', label: 'WebP' },
  { id: 'avif', label: 'AVIF' },
]

const ACCEPTED = 'image/png,image/jpeg,image/webp,image/avif,image/gif,image/tiff'
const ACCEPTED_EXT = ['PNG', 'JPG', 'WEBP', 'AVIF', 'GIF', 'TIFF']

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / 1024 / 1024).toFixed(2)} MB`
}

export default function ImageCompression() {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [imageName, setImageName] = useState<string | null>(null)
  const [quality, setQuality] = useState(80)
  const [format, setFormat] = useState('jpeg')
  const [originalSize, setOriginalSize] = useState<number | null>(null)
  const [compressedSize, setCompressedSize] = useState<number | null>(null)
  const [encoding, setEncoding] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropzoneRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<File | null>(null)

  const loadFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    setImageSrc(prev => { if (prev) URL.revokeObjectURL(prev); return url })
    setImageName(file.name)
    setOriginalSize(file.size)
    setCompressedSize(null)
    fileRef.current = file
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) loadFile(file)
    e.target.value = ''
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) loadFile(file)
  }

  const handleSizes = (_original: number, compressed: number) => {
    setCompressedSize(compressed)
  }

  const download = async () => {
    if (!fileRef.current) return
    const buffer = await fileRef.current.arrayBuffer()
    const result = await window.electron.convert(buffer, format, quality)
    const blob = new Blob([result.buffer as ArrayBuffer], { type: `image/${format}` })
    const url = URL.createObjectURL(blob)
    const base = (imageName ?? 'image').replace(/\.[^.]+$/, '')
    const a = document.createElement('a')
    a.href = url
    a.download = `${base}-compressed.${format === 'jpeg' ? 'jpg' : format}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const reset = () => {
    if (imageSrc) URL.revokeObjectURL(imageSrc)
    setImageSrc(null)
    setImageName(null)
    setOriginalSize(null)
    setCompressedSize(null)
    setEncoding(false)
    fileRef.current = null
  }

  const saved = originalSize && compressedSize ? originalSize - compressedSize : null
  const savedPct = saved && originalSize ? Math.round((saved / originalSize) * 100) : null

  return (
    <section className="section py-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-body font-semibold text-foreground">Image Compression</h2>
          <p className="text-sm text-muted-foreground mt-1">Compress images with live before/after preview.</p>
        </div>
        {imageSrc && (
          <Button variant="outline" size="sm" onClick={reset} className="gap-1.5 shrink-0">
            <RotateCcw className="size-3.5" />
            Reset
          </Button>
        )}
      </div>

      {!imageSrc ? (
        <>
          <input ref={inputRef} type="file" accept={ACCEPTED} className="sr-only" onChange={onFileChange} />
          <div
            ref={dropzoneRef}
            onDrop={onDrop}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={e => { if (!dropzoneRef.current?.contains(e.relatedTarget as Node)) setDragOver(false) }}
            className={cn(
              "flex flex-col items-center justify-center py-10 w-full h-72 border border-border hover:border-primary rounded-3xl border-dashed transition-colors cursor-pointer gap-4",
              dragOver && "bg-accent"
            )}
          >
            <Button onClick={() => inputRef.current?.click()} variant="outline" className="w-20 h-20 border-border hover:border-primary transition-colors">
              <Import className="size-10 stroke-primary" />
            </Button>
            <div className="text-center">
              <h2 className="text-2xl font-body font-semibold text-foreground">Drop an image here</h2>
              <p className="text-sm text-muted-foreground mt-1">Compress and compare before and after</p>
            </div>
            <div className="flex items-center justify-center flex-wrap gap-2">
              {ACCEPTED_EXT.map(ext => (
                <Badge variant="secondary" key={ext} className="rounded-sm p-3 text-sm font-light text-primary">{ext}</Badge>
              ))}
            </div>
            <Button onClick={() => inputRef.current?.click()} className="bg-primary h-12 w-60 text-lg" variant="default">
              Browse Image
            </Button>
          </div>
        </>
      ) : (
        <div className="flex gap-6">
          {/* Left: controls */}
          <div className="w-64 shrink-0 space-y-5">
            <input ref={inputRef} type="file" accept={ACCEPTED} className="sr-only" onChange={onFileChange} />

            {/* Thumbnail */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Image</Label>
              <div
                onClick={() => inputRef.current?.click()}
                onDrop={onDrop}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false) }}
                className={cn(
                  "w-full rounded-xl border border-dashed p-3 flex flex-col items-center gap-2 text-center transition-colors cursor-pointer",
                  dragOver ? "border-primary/60 bg-accent/60" : "border-border hover:border-primary/50 hover:bg-accent/50"
                )}
              >
                <img src={imageSrc} className="w-full h-28 object-cover rounded-lg" />
                <p className="text-[10px] text-muted-foreground truncate w-full">{imageName}</p>
                <p className="text-[10px] text-muted-foreground">Click or drop to change</p>
              </div>
            </div>

            {/* Format */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Format</Label>
              <div className="flex gap-1">
                {FORMATS.map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFormat(f.id)}
                    disabled={encoding}
                    className={cn(
                      "flex-1 text-xs py-1.5 rounded-md border transition-colors",
                      encoding ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                      format === f.id ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quality */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Quality</Label>
                <span className="text-xs font-medium">{quality}%</span>
              </div>
              <input
                type="range" min={1} max={100} value={quality}
                onChange={e => setQuality(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Smaller</span><span>Better</span>
              </div>
            </div>

            {/* Size comparison */}
            {originalSize && (
              <div className="rounded-xl border border-border p-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Original</span>
                  <span className="font-medium">{formatBytes(originalSize)}</span>
                </div>
                {compressedSize && (
                  <>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Compressed</span>
                      <span className="font-medium">{formatBytes(compressedSize)}</span>
                    </div>
                    {saved !== null && savedPct !== null && (
                      <div className="flex justify-between text-xs border-t border-border pt-2 mt-1">
                        <span className="text-muted-foreground">Saved</span>
                        <span className={cn("font-medium", saved > 0 ? "text-green-500" : "text-muted-foreground")}>
                          {saved > 0 ? `${formatBytes(saved)} (${savedPct}%)` : 'No reduction'}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <Button onClick={download} className="w-full gap-1.5" size="sm">
              <Download className="size-3.5" />
              Download
            </Button>
          </div>

          {/* Right: comparison slider */}
          <div className="flex-1 min-w-0 flex flex-col justify-start">
            <p className="text-sm text-muted-foreground mb-3">Drag the slider to compare</p>
            <ComparisonSlider
              imageSrc={imageSrc}
              quality={quality}
              format={format}
              onSizes={handleSizes}
              onEncodingChange={setEncoding}
            />
          </div>
        </div>
      )}
    </section>
  )
}

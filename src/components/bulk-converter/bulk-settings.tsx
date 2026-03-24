import { cn } from '@/lib/utils'
import type { BulkState, OutputMode } from './use-bulk-converter'
import { useConvertStore } from '@/store/useConvertStore'
import { X } from 'lucide-react'

const FORMATS = ['webp', 'png', 'jpg', 'avif']
const OUTPUT_MODES: { value: OutputMode; label: string; desc: string }[] = [
  { value: 'alongside', label: 'Alongside originals', desc: 'Save converted files in the same folder' },
  { value: 'subfolder', label: 'Subfolder', desc: 'Save into a "converted/" subfolder' },
  { value: 'custom', label: 'Custom folder', desc: 'Pick a specific output folder' },
]

interface Props {
  state: BulkState
  setSetting: <K extends keyof BulkState>(key: K, value: BulkState[K]) => void
  disabled?: boolean
}

export function BulkSettings({ state, setSetting, disabled }: Props) {
  const defaultOutputFolder = useConvertStore(s => s.defaultOutputFolder)
  const setDefaultOutputFolder = useConvertStore(s => s.setDefaultOutputFolder)

  const pickOutputFolder = async () => {
    const path = await window.electron.bulkPickFolder()
    if (path) setDefaultOutputFolder(path)
    return path
  }

  return (
    <div className="space-y-5">
      {/* Format */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Output format</p>
        <div className="flex gap-1.5">
          {FORMATS.map(f => (
            <button
              key={f}
              disabled={disabled}
              onClick={() => setSetting('targetFormat', f)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed',
                state.targetFormat === f
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-primary/50'
              )}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Quality */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <p className="text-xs font-medium text-muted-foreground">Quality</p>
          <p className="text-xs font-medium text-foreground">{state.quality}%</p>
        </div>
        <input
          type="range"
          min={10}
          max={100}
          step={5}
          value={state.quality}
          disabled={disabled}
          onChange={e => setSetting('quality', Number(e.target.value))}
          className="w-full accent-primary disabled:opacity-40"
        />
      </div>

      {/* Output location */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Output location</p>
        <div className="space-y-1.5">
          {OUTPUT_MODES.map(m => (
            <button
              key={m.value}
              disabled={disabled}
              onClick={async () => {
                if (m.value === 'custom') {
                  const path = await pickOutputFolder()
                  if (!path) return
                }
                setSetting('outputMode', m.value)
              }}
              className={cn(
                'w-full flex items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed',
                state.outputMode === m.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <div className={cn(
                'mt-0.5 size-3.5 rounded-full border-2 shrink-0',
                state.outputMode === m.value ? 'border-primary bg-primary' : 'border-muted-foreground'
              )} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground leading-none mb-0.5">{m.label}</p>
                {m.value === 'custom' && state.outputMode === 'custom' && defaultOutputFolder
                  ? <p className="text-[10px] text-primary truncate">{defaultOutputFolder}</p>
                  : <p className="text-[10px] text-muted-foreground">{m.desc}</p>
                }
              </div>
              {m.value === 'custom' && state.outputMode === 'custom' && (
                <button
                  onClick={(e) => { e.stopPropagation(); setDefaultOutputFolder(null); setSetting('outputMode', 'alongside') }}
                  disabled={disabled}
                  className="shrink-0 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
                >
                  <X className="size-3" />
                </button>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Delete originals */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-foreground">Delete originals</p>
          <p className="text-[10px] text-muted-foreground">Remove source files after conversion</p>
        </div>
        <button
          disabled={disabled}
          onClick={() => setSetting('deleteOriginal', !state.deleteOriginal)}
          className={cn(
            'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
            state.deleteOriginal ? 'bg-primary' : 'bg-secondary'
          )}
        >
          <span className={cn(
            'pointer-events-none inline-block size-4 rounded-full bg-white shadow-sm transition-transform',
            state.deleteOriginal ? 'translate-x-4' : 'translate-x-0'
          )} />
        </button>
      </div>
    </div>
  )
}

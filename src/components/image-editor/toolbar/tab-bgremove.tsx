import { Eraser, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type BgRemoveStatus = 'idle' | 'loading' | 'done' | 'error'

interface Props {
  status: BgRemoveStatus
  progress: number
  onRemove: () => void
}

export function TabBgRemove({ status, progress, onRemove }: Props) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground leading-relaxed">
        Remove the background from your image using on-device AI. <br/>
        Model is downloaded once <em>(~40 MB)</em> and cached locally.
      </p>

      <Button
        className="w-full gap-2"
        size="sm"
        onClick={onRemove}
        disabled={status === 'loading'}
      >
        {status === 'loading' ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Eraser className="size-3.5" />
        )}
        {status === 'loading' ? 'Removing…' : status === 'done' ? 'Remove Again' : 'Remove Background'}
      </Button>

      {status === 'loading' && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{progress < 5 ? 'Loading model…' : 'Processing…'}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {status === 'error' && (
        <p className="text-xs text-destructive">Something went wrong. Try again.</p>
      )}

      {status === 'done' && (
        <p className="text-xs text-green-500">Background removed successfully.</p>
      )}
    </div>
  )
}

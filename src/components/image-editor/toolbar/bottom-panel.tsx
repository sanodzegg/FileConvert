import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Sparkles } from 'lucide-react'
import { TabAdjust } from './tab-adjust'
import { TabEffects } from './tab-effects'
import { TabBgRemove, type BgRemoveStatus } from './tab-bgremove'
import type { Adjustments } from './types'
import { DEFAULT_ADJUSTMENTS } from './types'

type BottomTab = 'adjust' | 'effects' | 'bgremove'

interface Props {
  adjustments: Adjustments
  onAdjustments: (a: Adjustments) => void
  bgRemoveStatus: BgRemoveStatus
  bgRemoveProgress: number
  onBgRemove: () => void
}

export function BottomPanel({ adjustments, onAdjustments, bgRemoveStatus, bgRemoveProgress, onBgRemove }: Props) {
  const [activeTab, setActiveTab] = useState<BottomTab>('adjust')
  const [activePreset, setActivePreset] = useState<string | null>(null)

  const handleAdjustments = (a: Adjustments) => {
    setActivePreset(null)
    onAdjustments(a)
  }

  return (
    <div className="rounded-2xl border border-border bg-secondary/20 overflow-hidden">
      <div className="flex border-b border-border">
        {(['adjust', 'effects', 'bgremove'] as BottomTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-5 py-2.5 text-xs font-medium transition-colors cursor-pointer',
              activeTab === tab
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab === 'adjust' ? 'Adjust' : tab === 'effects' ? 'Effects' : (
              <span className="flex items-center gap-1.5">
                <Sparkles className="size-3" />
                BG Remove
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="p-4">
        {activeTab === 'adjust' && (
          <TabAdjust
            adjustments={adjustments}
            onChange={handleAdjustments}
            onReset={() => { onAdjustments(DEFAULT_ADJUSTMENTS); setActivePreset(null) }}
            grid
          />
        )}
        {activeTab === 'effects' && (
          <TabEffects
            adjustments={adjustments}
            activePreset={activePreset}
            onChange={onAdjustments}
            onPresetSelect={setActivePreset}
            cols={6}
          />
        )}
        {activeTab === 'bgremove' && (
          <TabBgRemove
            status={bgRemoveStatus}
            progress={bgRemoveProgress}
            onRemove={onBgRemove}
          />
        )}
      </div>
    </div>
  )
}

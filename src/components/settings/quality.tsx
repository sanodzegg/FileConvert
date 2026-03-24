import { useState } from 'react'
import { useConvertStore } from '@/store/useConvertStore'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import ComparisonSlider from './comparison-slider'

type FormatType = 'image' | 'video' | 'audio'

const FORMAT_TABS: { id: FormatType; label: string; description: string }[] = [
    { id: 'image', label: 'Image', description: 'JPG, PNG, WebP, AVIF...' },
    { id: 'video', label: 'Video', description: 'MP4, MOV, AVI...' },
    { id: 'audio', label: 'Audio', description: 'MP3, AAC, FLAC...' },
]

export default function QualityPicker() {
    const imageQuality = useConvertStore(s => s.imageQuality)
    const videoQuality = useConvertStore(s => s.videoQuality)
    const audioQuality = useConvertStore(s => s.audioQuality)
    const setImageQuality = useConvertStore(s => s.setImageQuality)
    const setVideoQuality = useConvertStore(s => s.setVideoQuality)
    const setAudioQuality = useConvertStore(s => s.setAudioQuality)

    const [activeTab, setActiveTab] = useState<FormatType>('image')

    const stored = { image: imageQuality, video: videoQuality, audio: audioQuality }
    const setters = { image: setImageQuality, video: setVideoQuality, audio: setAudioQuality }

    const [locals, setLocals] = useState({ image: imageQuality, video: videoQuality, audio: audioQuality })

    const localValue = locals[activeTab]
    const storedValue = stored[activeTab]
    const isDirty = localValue !== storedValue

    const handleApply = () => {
        setters[activeTab](localValue)
    }

    return (
        <div className="p-5 rounded-2xl border border-accent bg-secondary/30 space-y-4">
            {activeTab === 'image' && <ComparisonSlider quality={localValue} />}
            <div>
                <p className="text-sm font-medium text-primary">Quality</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                    Per-format quality defaults. Lower = smaller file size.
                </p>
            </div>

            {/* Format tabs */}
            <div className="flex gap-1.5">
                {FORMAT_TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 rounded-xl border py-2 text-xs font-medium transition-colors cursor-pointer ${
                            activeTab === tab.id
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-accent bg-secondary/30 text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Slider for active tab */}
            <div className="flex items-center gap-4">
                <Slider
                    min={1}
                    max={100}
                    step={1}
                    value={[localValue]}
                    onValueChange={(v) => setLocals(prev => ({ ...prev, [activeTab]: Array.isArray(v) ? v[0] : v }))}
                    className="w-full"
                />
                <span className="text-sm font-medium text-primary w-10 text-right shrink-0">{localValue}%</span>
            </div>

            <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                    {FORMAT_TABS.find(t => t.id === activeTab)?.description}
                </p>
                <Button
                    size="sm"
                    disabled={!isDirty}
                    onClick={handleApply}
                >
                    Apply
                </Button>
            </div>
        </div>
    )
}

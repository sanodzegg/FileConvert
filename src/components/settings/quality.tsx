import { useState } from 'react'
import { useConvertStore } from '@/store/useConvertStore'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import ComparisonSlider from './comparison-slider'

export default function QualityPicker() {
    const quality = useConvertStore(s => s.quality)
    const setQuality = useConvertStore(s => s.setQuality)
    const [local, setLocal] = useState(quality)

    return (
        <div className="p-5 rounded-2xl border border-accent bg-secondary/30 space-y-4">
            <ComparisonSlider quality={quality} />
            <div>
                <p className="text-sm font-medium text-primary">Quality</p>
                <p className="text-xs text-muted-foreground mt-0.5">Applies to all conversions. Lower quality = smaller file size.</p>
            </div>
            <div className="flex items-center gap-4">
                <Slider
                    min={1}
                    max={100}
                    step={1}
                    value={[local]}
                    onValueChange={(v) => setLocal(Array.isArray(v) ? v[0] : v)}
                    className="w-full"
                />
                <span className="text-sm font-medium text-primary w-10 text-right shrink-0">{local}%</span>
            </div>
            <div className="flex items-center justify-between">
                <div className="flex items-center justify-between text-xs text-muted-foreground gap-x-2.5">
                    <span>Smaller</span>
                    <ArrowRight size={14} />
                    <span>Best</span>
                </div>
                <Button
                    size="sm"
                    disabled={local === quality}
                    onClick={() => setQuality(local)}
                >
                    Apply
                </Button>
            </div>
        </div>
    )
}

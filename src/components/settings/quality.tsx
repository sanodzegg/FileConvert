import { useState } from 'react'
import { useConvertStore } from '@/store/useConvertStore'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import ComparisonSlider from './comparison-slider'

export default function QualityPicker() {
    const imageQuality = useConvertStore(s => s.imageQuality)
    const setImageQuality = useConvertStore(s => s.setImageQuality)

    const [local, setLocal] = useState(imageQuality)
    const isDirty = local !== imageQuality

    return (
        <div className="p-5 2xl:p-6 rounded-2xl border border-accent bg-secondary/30 space-y-4 2xl:space-y-5">
            <ComparisonSlider quality={local} />
            <div>
                <p className="text-sm 2xl:text-base font-medium text-primary">Image Quality</p>
                <p className="text-xs 2xl:text-sm text-muted-foreground mt-0.5">
                    Default quality for image conversions. Lower = smaller file size.
                </p>
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
                <span className="text-sm 2xl:text-base font-medium text-primary w-10 2xl:w-12 text-right shrink-0">{local}%</span>
            </div>

            <div className="flex items-center justify-between">
                <p className="text-xs 2xl:text-sm text-muted-foreground">JPG, PNG, WebP, AVIF…</p>
                <Button size="sm" className="2xl:text-sm 2xl:h-9 2xl:px-4" disabled={!isDirty} onClick={() => setImageQuality(local)}>
                    Apply
                </Button>
            </div>
        </div>
    )
}

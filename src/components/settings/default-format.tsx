import { useConvertStore } from '@/store/useConvertStore'
import { imageEngine } from '@/engines/imageEngine'
import { documentEngine } from '@/engines/documentEngine'
import { videoEngine } from '@/engines/videoEngine'
import {
    Combobox,
    ComboboxInput,
    ComboboxContent,
    ComboboxList,
    ComboboxItem,
} from '@/components/ui/combobox'

interface FormatPickerProps {
    label: string
    description: string
    value: string
    formats: string[]
    onChange: (v: string) => void
}

function FormatPicker({ label, description, value, formats, onChange }: FormatPickerProps) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm 2xl:text-base font-medium text-primary">{label}</p>
                <p className="text-xs 2xl:text-sm text-muted-foreground mt-0.5">{description}</p>
            </div>
            <Combobox value={value} onValueChange={(v) => v && onChange(v)} items={formats} filter={null}>
                <ComboboxInput className={'w-28! h-9! 2xl:w-32! 2xl:h-10! [&_input]:uppercase! [&_input]:select-none!'} readOnly />
                <ComboboxContent>
                    <ComboboxList>
                        {(item) => (
                            <ComboboxItem className={'uppercase'} key={item} value={item}>
                                {item}
                            </ComboboxItem>
                        )}
                    </ComboboxList>
                </ComboboxContent>
            </Combobox>
        </div>
    )
}

export default function DefaultFormat() {
    const defaultImageFormat = useConvertStore(s => s.defaultImageFormat)
    const defaultDocumentFormat = useConvertStore(s => s.defaultDocumentFormat)
    const defaultVideoFormat = useConvertStore(s => s.defaultVideoFormat)
    const setDefaultImageFormat = useConvertStore(s => s.setDefaultImageFormat)
    const setDefaultDocumentFormat = useConvertStore(s => s.setDefaultDocumentFormat)
    const setDefaultVideoFormat = useConvertStore(s => s.setDefaultVideoFormat)

    return (
        <div className="p-5 2xl:p-6 rounded-2xl border border-accent bg-secondary/30 space-y-5 2xl:space-y-6">
            <div>
                <p className="text-sm 2xl:text-base font-medium text-primary">Default Output Format</p>
                <p className="text-xs 2xl:text-sm text-muted-foreground mt-0.5">Format applied to newly added files.</p>
            </div>
            <div className="space-y-4 2xl:space-y-5">
                <FormatPicker
                    label="Images"
                    description="JPG, PNG, WEBP, AVIF..."
                    value={defaultImageFormat}
                    formats={imageEngine.outputFormats}
                    onChange={setDefaultImageFormat}
                />
                <FormatPicker
                    label="Documents"
                    description="PDF, DOCX, TXT..."
                    value={defaultDocumentFormat}
                    formats={documentEngine.outputFormats}
                    onChange={setDefaultDocumentFormat}
                />
                <FormatPicker
                    label="Videos"
                    description="MP4, MOV, AVI, MKV..."
                    value={defaultVideoFormat}
                    formats={videoEngine.outputFormats}
                    onChange={setDefaultVideoFormat}
                />
            </div>
        </div>
    )
}

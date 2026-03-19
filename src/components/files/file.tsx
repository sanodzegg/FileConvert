import { Badge } from "../ui/badge"
import {
    Combobox,
    ComboboxContent,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from "@/components/ui/combobox"
import { MoveRight, X } from "lucide-react"
import { useConvertStore } from "@/store/useConvertStore"
import { fileKey, getExtension, formatBytes } from "@/utils/fileUtils"
import { getFormatsForFile } from "@/engines/engineRegistry"
import { Button } from "../ui/button"
import FileSettingsDialog from "./file-settings-dialog"

export default function File({ data }: { data: File }) {
    const ext = getExtension(data)
    const formatKey = ext || null
    const colorStyle = formatKey ? {
        backgroundColor: `var(--badge-${formatKey}-bg)`,
        borderColor: `var(--badge-${formatKey}-border)`,
        color: `var(--badge-${formatKey}-text)`,
    } : {}

    const convertTo = getFormatsForFile(data)

    const targetFormat = useConvertStore(s => s.fileSettings[fileKey(data)]?.targetFormat ?? convertTo[0])
    const setTargetFormat = useConvertStore(s => s.setTargetFormat)
    const isDone = useConvertStore(s => !!s.convertedFiles[fileKey(data)])
    const failedError = useConvertStore(s => s.failedFiles[fileKey(data)] ?? null)
    const removeFile = useConvertStore(s => s.removeFile)

    if (isDone) return null;

    return (
        <div className={`flex items-center justify-start p-4 rounded-2xl border bg-secondary/30 ${failedError ? 'border-destructive/40 bg-destructive/5' : 'border-accent'}`}>
            <Badge variant={'secondary'} className="shrink-0 uppercase h-10 w-10 rounded-sm mr-2" style={colorStyle}>
                {ext}
            </Badge>
            <div className="flex flex-col">
                <h3 className="text-sm font-normal text-accent-foreground font-body">{data.name}</h3>
                {failedError
                    ? <p className="text-xs font-normal text-destructive">{failedError}</p>
                    : <p className="text-xs font-normal text-accent-foreground/50">{formatBytes(data.size)}</p>
                }
            </div>
            <MoveRight size={24} className="stroke-accent ml-auto -mr-20" />
            <div className="ml-auto">
                <div className="flex items-center gap-2">
                    <Combobox value={targetFormat} onValueChange={(v) => setTargetFormat(data, v ?? convertTo[0])} items={convertTo}>
                        <ComboboxInput className={'w-24! h-10! [&_input]:uppercase! [&_input]:select-none!'} readOnly />
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
                    <FileSettingsDialog file={data} />
                    {failedError && (
                        <Button variant="destructive" size="icon" onClick={() => removeFile(data)}>
                            <X className="size-4" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}

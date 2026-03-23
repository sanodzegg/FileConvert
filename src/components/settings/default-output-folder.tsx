import { FolderOpen, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useConvertStore } from '@/store/useConvertStore'

export default function DefaultOutputFolder() {
    const defaultOutputFolder = useConvertStore(s => s.defaultOutputFolder)
    const setDefaultOutputFolder = useConvertStore(s => s.setDefaultOutputFolder)

    const pickFolder = async () => {
        const path = await window.electron.bulkPickFolder()
        if (path) setDefaultOutputFolder(path)
    }

    return (
        <div className="p-5 rounded-2xl border border-accent bg-secondary/30 space-y-4">
            <div>
                <p className="text-sm font-medium text-primary">Default Output Folder</p>
                <p className="text-xs text-muted-foreground mt-0.5">Where converted files are saved in the bulk converter. Leave empty to save alongside originals.</p>
            </div>
            <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-xs text-muted-foreground truncate">
                    {defaultOutputFolder ?? 'Not set — saves alongside originals'}
                </div>
                <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={pickFolder}>
                    <FolderOpen className="size-3.5" />
                    Browse
                </Button>
                {defaultOutputFolder && (
                    <Button variant="outline" size="sm" className="shrink-0 px-2" onClick={() => setDefaultOutputFolder(null)}>
                        <X className="size-3.5" />
                    </Button>
                )}
            </div>
        </div>
    )
}

import { Import } from "lucide-react";
import { Button } from "../ui/button";
import { useRef, useState } from "react";
import { useConvertStore } from "@/store/useConvertStore";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";
import { getAllSupportedExtensions, getExtensionsByGroup } from "@/engines/engineRegistry";

export default function Dropbox() {
    const groups = getExtensionsByGroup();
    const [activeGroup, setActiveGroup] = useState(groups[0]?.label ?? '');

    const inputRef = useRef<HTMLInputElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const handleClickRedirection = () => inputRef.current && inputRef.current.click();
    const handleDragEnter = () => wrapperRef.current && wrapperRef.current.classList.add('dragenter');
    const handleDragEnd = () => wrapperRef.current && wrapperRef.current.classList.remove('dragenter');
    const preventDragOver = (e: React.DragEvent) => e.preventDefault();

    const { receiveFiles } = useConvertStore();
    const handleFiles = (files: FileList | null) => receiveFiles(Array.from(files ?? []));

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        handleFiles(e.dataTransfer.files);
        wrapperRef.current && wrapperRef.current.classList.remove('dragenter')
    }
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFiles(e.target.files)
        e.target.value = ''
    }

    const activeFormats = groups.find(g => g.label === activeGroup)?.formats ?? [];

    return (
        <form>
            <input ref={inputRef} multiple onChange={handleInputChange} className="sr-only" type="file" name="userFiles" id="userFiles" accept={getAllSupportedExtensions().map(e => `.${e}`).join(',')} />
            <div ref={wrapperRef} onDrop={handleDrop} onDragOver={preventDragOver} onDragEnter={handleDragEnter} onDragEnd={handleDragEnd} className="flex flex-col items-center justify-center w-full border border-border hover:border-primary rounded-3xl border-dashed transition-colors cursor-pointer gap-4 [&.dragenter]:bg-accent pt-10 pb-8">
                <Button onClick={handleClickRedirection} variant="outline" className="w-20 h-20 border-border hover:border-primary transition-colors">
                    <Import className="size-10 stroke-primary" />
                </Button>

                <div className="text-center">
                    <h2 className="text-2xl font-body font-semibold text-foreground">Drop files here</h2>
                    <p className="text-sm text-muted-foreground mt-1">or browse from your computer</p>
                </div>

                <div className="flex flex-col items-center gap-3 w-full max-w-lg px-8">
                    <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                        {groups.map(group => (
                            <button
                                key={group.label}
                                type="button"
                                onClick={() => setActiveGroup(group.label)}
                                className={cn(
                                    'px-4 py-1.5 rounded-full text-sm border transition-colors',
                                    activeGroup === group.label
                                        ? 'border-primary text-primary bg-primary/10'
                                        : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                                )}
                            >
                                {group.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-wrap justify-center gap-1.5 h-24 content-start overflow-hidden">
                        {activeFormats.map(fmt => (
                            <Badge variant="secondary" key={fmt} className="rounded-sm px-2.5 py-1.5 text-sm font-light text-primary">{fmt}</Badge>
                        ))}
                    </div>
                </div>

                <Button onClick={handleClickRedirection} className="bg-primary h-12 w-60 text-lg" variant="default">Browse Files</Button>
            </div>
        </form>
    )
}
import File from "./file"
import { Button } from "../ui/button"
import { useConvertStore } from "@/store/useConvertStore"
import { fileKey } from "@/utils/fileUtils"
import { convertAll } from "@/services/conversionService"
import { useConversionCountContext } from "@/lib/ConversionCountContext"
import { useAuth } from "@/lib/useAuth"

export default function FileList() {
    const { files, fileSettings, quality, imageQuality, convertedCount, convertingTotal, convertingFiles, convertedFiles, failedFiles, setConvertedFile, setFailedFile, markFileConverting, unmarkFileConverting, startConversion, removeFile } = useConvertStore()
    const { onConversionSuccess, onBatchComplete, onPlanExhausted } = useConversionCountContext()
    const { plan } = useAuth()

    const failedCount = Object.keys(failedFiles).length
    const isConverting = convertingFiles.size > 0 || (convertingTotal > 0 && (convertedCount + failedCount) < convertingTotal)
    const allDone = files.length > 0 && files.every(f => !!convertedFiles[fileKey(f)])

    const handleConvertAll = async () => {
        await convertAll(files, {
            quality,
            imageQuality,
            fileSettings,
            convertedFiles,
            convertingFiles,
            startConversion,
            setConvertedFile,
            setFailedFile,
            markFileConverting,
            unmarkFileConverting,
            removeFile,
            plan,
            onConversionSuccess,
            onBatchComplete,
            onPlanExhausted,
        })
    }

    if (files.length === 0 || allDone) return null

    return (
        <section className="py-6 2xl:py-8">
            <div className="mb-6 2xl:mb-8 flex items-center justify-between">
                <h3 className="font-medium text-primary/60 font-body text-base 2xl:text-lg">Added ({files.length})</h3>
                <Button onClick={handleConvertAll} disabled={isConverting} variant={'secondary'} className={'font-normal 2xl:text-base 2xl:h-10 2xl:px-5'}>
                    Convert All
                </Button>
            </div>
            <ul className="space-y-2.5 2xl:space-y-3">
                {files.map((file, i) => (
                    <li key={`${file.lastModified}${i}${file.size}`}>
                        <File data={file} />
                    </li>
                ))}
            </ul>
        </section>
    )
}

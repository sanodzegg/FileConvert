import { getEngineForFile } from '@/engines/engineRegistry'
import { fileKey } from '@/utils/fileUtils'
import type { ConvertStore } from '@/store/useConvertStore'

type ConversionDeps = Pick<
  ConvertStore,
  | 'quality'
  | 'fileSettings'
  | 'convertedFiles'
  | 'startConversion'
  | 'setConvertedFile'
  | 'setFailedFile'
  | 'setCurrentFileName'
  | 'removeFile'
>

export async function convertAll(files: File[], deps: ConversionDeps): Promise<void> {
  const pending = files.filter((f) => !deps.convertedFiles[fileKey(f)])
  if (pending.length === 0) return

  deps.startConversion(pending)

  await Promise.allSettled(
    pending.map(async (file) => {
      const engine = getEngineForFile(file)
      if (!engine) {
        deps.setFailedFile(file, 'No engine available for this file type')
        return
      }

      const settings = deps.fileSettings[fileKey(file)]
      const targetFormat = settings?.targetFormat
      if (!targetFormat) {
        deps.setFailedFile(file, 'No target format selected')
        return
      }

      const quality = settings.quality ?? deps.quality

      try {
        deps.setCurrentFileName(file.name)
        const blob = await engine.convert(file, targetFormat, {
          quality,
          width: settings.width,
          height: settings.height,
          fit: settings.fit,
          keepMetadata: settings.keepMetadata,
        })
        deps.setConvertedFile(file, blob)
        deps.removeFile(file)
      } catch (err) {
        deps.setFailedFile(file, err instanceof Error ? err.message : 'Unknown error')
      }
    })
  )

  deps.setCurrentFileName('')
}

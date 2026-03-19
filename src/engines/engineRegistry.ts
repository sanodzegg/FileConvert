import type { ConversionEngine } from './ConversionEngine'
import { imageEngine } from './imageEngine'
import { videoEngine } from './videoEngine'
import { documentEngine } from './documentEngine'
import { getExtension } from '@/utils/fileUtils'

const ALL_ENGINES: ConversionEngine[] = [imageEngine, videoEngine, documentEngine]

const extensionToEngine = new Map<string, ConversionEngine>()
for (const engine of ALL_ENGINES) {
  for (const ext of engine.supportedInputExtensions) {
    if (!extensionToEngine.has(ext)) {
      extensionToEngine.set(ext, engine)
    }
  }
}

export function getEngineForFile(file: File): ConversionEngine | null {
  const ext = getExtension(file)
  return extensionToEngine.get(ext) ?? null
}

export function getFormatsForFile(file: File): string[] {
  const engine = getEngineForFile(file)
  if (!engine) return []
  const ext = getExtension(file)
  return engine.outputFormats.filter(f => f !== ext)
}

export function getAllSupportedExtensions(): string[] {
  return Array.from(extensionToEngine.keys())
}


export { imageEngine }

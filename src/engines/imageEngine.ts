import type { ConversionEngine } from './ConversionEngine'
import type { ConversionOptions } from '@/types'

export const IMAGE_INPUT_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'tiff', 'svg']
export const IMAGE_OUTPUT_FORMATS = ['webp', 'png', 'jpg', 'avif', 'gif', 'tiff']

export const imageEngine: ConversionEngine = {
  id: 'image',
  name: 'Sharp Image Engine',
  supportedInputExtensions: IMAGE_INPUT_EXTENSIONS,
  outputFormats: IMAGE_OUTPUT_FORMATS,

  async convert(file: File, targetFormat: string, options: ConversionOptions): Promise<Blob> {
    const buffer = await file.arrayBuffer()
    const result = await window.electron.convert(buffer, targetFormat, options.quality, {
      width: options.width,
      height: options.height,
      fit: options.fit,
      keepMetadata: options.keepMetadata,
    })
    return new Blob([result.buffer as ArrayBuffer], { type: `image/${targetFormat}` })
  },
}

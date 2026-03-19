export interface FileSettings {
  targetFormat: string
  quality?: number
}

export interface ConvertedFile {
  name: string
  format: string
  blob: Blob
}

export interface ConversionOptions {
  quality: number
}

export interface FileSliceState {
  files: File[]
}

export interface FileSliceActions {
  receiveFiles: (files: File[]) => void
  removeFile: (file: File) => void
}

export interface ConversionSliceState {
  fileSettings: Record<string, FileSettings>
  convertedFiles: Record<string, ConvertedFile>
  failedFiles: Record<string, string>
  convertedCount: number
  convertingTotal: number
  totalInputSize: number
  totalOutputSize: number
  currentFileName: string
}

export interface ConversionSliceActions {
  setFileSettings: (file: File, settings: Partial<FileSettings>) => void
  setTargetFormat: (file: File, format: string) => void
  setConvertedFile: (file: File, blob: Blob) => void
  setFailedFile: (file: File, error: string) => void
  startConversion: (files: File[]) => void
  setCurrentFileName: (name: string) => void
  resetConversion: () => void
}

export interface SettingsSliceState {
  quality: number
  defaultImageFormat: string
  defaultDocumentFormat: string
  defaultVideoFormat: string
}

export interface SettingsSliceActions {
  setQuality: (quality: number) => void
  setDefaultImageFormat: (format: string) => void
  setDefaultDocumentFormat: (format: string) => void
  setDefaultVideoFormat: (format: string) => void
}

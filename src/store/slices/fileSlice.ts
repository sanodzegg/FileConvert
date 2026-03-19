import type { StateCreator } from 'zustand'
import type {
  FileSliceState,
  FileSliceActions,
  ConversionSliceState,
  SettingsSliceState,
  FileSettings,
} from '@/types'
import { fileKey } from '@/utils/fileUtils'
import { getEngineForFile, getFormatsForFile } from '@/engines/engineRegistry'

type FullStore = FileSliceState & FileSliceActions & ConversionSliceState & SettingsSliceState

function getDefaultForFile(file: File, state: SettingsSliceState): string {
  const engine = getEngineForFile(file)
  if (!engine) return ''
  if (engine.id === 'image') return state.defaultImageFormat
  if (engine.id === 'document') return state.defaultDocumentFormat
  if (engine.id === 'video') return state.defaultVideoFormat
  return ''
}

export const createFileSlice: StateCreator<
  FullStore,
  [],
  [],
  FileSliceState & FileSliceActions
> = (set) => ({
  files: [],

  receiveFiles: (files) =>
    set((state) => {
      const existing = new Set(state.files.map(fileKey))
      const newFiles = files.filter((f) => {
        if (!getEngineForFile(f)) return false
        const k = fileKey(f)
        if (existing.has(k)) return false
        existing.add(k)
        return true
      })

      const newSettings: Record<string, FileSettings> = {}
      newFiles.forEach((f) => {
        const preferred = getDefaultForFile(f, state)
        const formats = getFormatsForFile(f)
        const targetFormat =
          formats.includes(preferred) ? preferred : (formats[0] ?? '')
        newSettings[fileKey(f)] = { targetFormat }
      })

      return {
        files: [...state.files, ...newFiles],
        fileSettings: { ...state.fileSettings, ...newSettings },
      }
    }),

  removeFile: (file) =>
    set((state) => {
      const k = fileKey(file)
      const { [k]: _fs, ...fileSettings } = state.fileSettings
      const { [k]: _ff, ...failedFiles } = state.failedFiles
      return {
        files: state.files.filter((f) => fileKey(f) !== k),
        fileSettings,
        failedFiles,
      }
    }),
})

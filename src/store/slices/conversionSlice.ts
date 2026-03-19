import type { StateCreator } from 'zustand'
import type {
  ConversionSliceState,
  ConversionSliceActions,
  FileSliceState,
  SettingsSliceState,
} from '@/types'
import { fileKey, getExtension } from '@/utils/fileUtils'
import { getEngineForFile } from '@/engines/engineRegistry'

type FullStore = FileSliceState & ConversionSliceState & ConversionSliceActions & SettingsSliceState

export const createConversionSlice: StateCreator<
  FullStore,
  [],
  [],
  ConversionSliceState & ConversionSliceActions
> = (set, get) => ({
  fileSettings: {},
  convertedFiles: {},
  failedFiles: {},
  convertedCount: 0,
  convertingTotal: 0,
  totalInputSize: 0,
  totalOutputSize: 0,
  currentFileName: '',

  setFileSettings: (file, settings) =>
    set((state) => ({
      fileSettings: {
        ...state.fileSettings,
        [fileKey(file)]: { ...state.fileSettings[fileKey(file)], ...settings },
      },
    })),

  setTargetFormat: (file, format) =>
    set((state) => ({
      fileSettings: {
        ...state.fileSettings,
        [fileKey(file)]: { ...state.fileSettings[fileKey(file)], targetFormat: format },
      },
    })),

  setConvertedFile: (file, blob) => {
    const settings = get().fileSettings[fileKey(file)]
    const format = settings?.targetFormat ?? getExtension(file)
    const sourceFormat = getExtension(file)
    const engineId = getEngineForFile(file)?.id ?? 'unknown'
    const name = file.name.replace(/\.[^.]+$/, `.${format}`)
    set((state) => ({
      convertedFiles: {
        ...state.convertedFiles,
        [fileKey(file)]: { name, format, sourceFormat, engineId, inputSize: file.size, blob },
      },
      convertedCount: state.convertedCount + 1,
      totalOutputSize: state.totalOutputSize + blob.size,
    }))
  },

  setFailedFile: (file, error) =>
    set((state) => ({
      failedFiles: { ...state.failedFiles, [fileKey(file)]: error },
    })),

  startConversion: (files) =>
    set({
      convertedCount: 0,
      convertingTotal: files.length,
      failedFiles: {},
      totalInputSize: files.reduce((acc, f) => acc + f.size, 0),
      totalOutputSize: 0,
      currentFileName: '',
    }),

  setCurrentFileName: (name) => set({ currentFileName: name }),

  resetConversion: () =>
    set({
      files: [],
      fileSettings: {},
      convertedFiles: {},
      failedFiles: {},
      convertedCount: 0,
      convertingTotal: 0,
      totalInputSize: 0,
      totalOutputSize: 0,
      currentFileName: '',
    }),
})

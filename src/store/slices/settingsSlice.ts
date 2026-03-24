import type { StateCreator } from 'zustand'
import type {
  SettingsSliceState,
  SettingsSliceActions,
  FileSliceState,
  FileSliceActions,
  ConversionSliceState,
  ConversionSliceActions,
} from '@/types'

type FullStore = FileSliceState &
  FileSliceActions &
  ConversionSliceState &
  ConversionSliceActions &
  SettingsSliceState &
  SettingsSliceActions

export const createSettingsSlice: StateCreator<
  FullStore,
  [['zustand/persist', unknown]],
  [],
  SettingsSliceState & SettingsSliceActions
> = (set) => ({
  quality: 60,
  imageQuality: 80,
  videoQuality: 60,
  audioQuality: 80,
  defaultImageFormat: 'webp',
  defaultDocumentFormat: 'pdf',
  defaultVideoFormat: 'mp4',
  defaultOutputFolder: null,
  pendingEditorFile: null,
  setQuality: (quality) => set({ quality }),
  setImageQuality: (imageQuality) => set({ imageQuality }),
  setVideoQuality: (videoQuality) => set({ videoQuality }),
  setAudioQuality: (audioQuality) => set({ audioQuality }),
  setDefaultImageFormat: (defaultImageFormat) => set({ defaultImageFormat }),
  setDefaultDocumentFormat: (defaultDocumentFormat) => set({ defaultDocumentFormat }),
  setDefaultVideoFormat: (defaultVideoFormat) => set({ defaultVideoFormat }),
  setDefaultOutputFolder: (defaultOutputFolder) => set({ defaultOutputFolder }),
  setPendingEditorFile: (pendingEditorFile) => set({ pendingEditorFile }),
})

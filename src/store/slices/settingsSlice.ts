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
  defaultImageFormat: 'webp',
  defaultDocumentFormat: 'pdf',
  defaultVideoFormat: 'mp4',
  setQuality: (quality) => set({ quality }),
  setDefaultImageFormat: (defaultImageFormat) => set({ defaultImageFormat }),
  setDefaultDocumentFormat: (defaultDocumentFormat) => set({ defaultDocumentFormat }),
  setDefaultVideoFormat: (defaultVideoFormat) => set({ defaultVideoFormat }),
})

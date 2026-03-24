/**
 * Estimates output file size based on input size, source format, target format, and quality.
 * Ratios are calibrated source-to-target (not via raw pixel baseline) to avoid large errors
 * when source is already compressed (JPEG, WebP, AVIF).
 * Returns null for formats where estimation is unreliable.
 */

// source → target conversion ratios relative to input file size, at quality ~80
// e.g. jpg→webp: 0.30 means a 1MB JPEG typically yields ~300KB WebP at q80
const CONVERSION_RATIO: Partial<Record<string, Partial<Record<string, number>>>> = {
  jpg:  { webp: 0.30, avif: 0.25, png: 2.8,  jpg: 1.0,  gif: 1.8,  tiff: 3.2  },
  jpeg: { webp: 0.30, avif: 0.25, png: 2.8,  jpg: 1.0,  gif: 1.8,  tiff: 3.2  },
  jfif: { webp: 0.30, avif: 0.25, png: 2.8,  jpg: 1.0,  gif: 1.8,  tiff: 3.2  },
  webp: { jpg: 1.2,  avif: 0.85,  png: 3.2,  webp: 1.0, gif: 2.0,  tiff: 3.8  },
  avif: { jpg: 1.4,  webp: 1.2,   png: 3.8,  avif: 1.0, gif: 2.2,  tiff: 4.2  },
  heic: { jpg: 1.2,  webp: 1.0,   png: 3.2,  avif: 0.9, gif: 2.0,  tiff: 3.8  },
  heif: { jpg: 1.2,  webp: 1.0,   png: 3.2,  avif: 0.9, gif: 2.0,  tiff: 3.8  },
  png:  { webp: 0.12, avif: 0.10, jpg: 0.18, png: 1.0,  gif: 0.85, tiff: 1.1  },
  gif:  { webp: 0.15, avif: 0.12, jpg: 0.22, png: 1.2,  gif: 1.0,  tiff: 1.3  },
  tiff: { webp: 0.10, avif: 0.08, jpg: 0.15, png: 0.90, gif: 0.75, tiff: 1.0  },
  tif:  { webp: 0.10, avif: 0.08, jpg: 0.15, png: 0.90, gif: 0.75, tiff: 1.0  },
  svg:  { webp: 0.40, avif: 0.35, jpg: 0.50, png: 0.60, tiff: 0.80            },
}

// Quality scaling: at q80 the ratio above applies; scale up/down from there.
// Effect is log-ish — quality has diminishing impact at extremes.
function qualityScale(quality: number): number {
  // Anchored at q80 = 1.0. q100 ≈ 1.5, q50 ≈ 0.65, q1 ≈ 0.15
  return Math.pow(quality / 80, 1.2)
}

export function estimateOutputSize(
  inputSize: number,
  sourceExt: string,
  targetFormat: string,
  quality: number,
): number | null {
  const src = sourceExt.toLowerCase()
  const tgt = targetFormat.toLowerCase()

  if (src === tgt) return null // same format: estimate not useful

  const ratio = CONVERSION_RATIO[src]?.[tgt]
  if (ratio === undefined) return null

  return Math.round(inputSize * ratio * qualityScale(quality))
}

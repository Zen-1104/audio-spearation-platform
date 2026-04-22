export const ALLOWED_TYPES = ['audio/wav', 'audio/wave', 'audio/x-wav', 'audio/mpeg', 'audio/mp3']
export const ALLOWED_EXTENSIONS = ['.wav', '.mp3']
export const MAX_SIZE_BYTES = 50 * 1024 * 1024 // 50MB

/**
 * Validate an audio file against format and size constraints.
 * @param {File} file
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validateAudioFile(file) {
  if (!file) {
    return { valid: false, error: 'No file selected.' }
  }

  const ext = '.' + file.name.split('.').pop().toLowerCase()
  const typeOk = ALLOWED_TYPES.includes(file.type)
  const extOk = ALLOWED_EXTENSIONS.includes(ext)

  if (!typeOk && !extOk) {
    return { valid: false, error: 'Only WAV and MP3 files are allowed.' }
  }

  if (file.size > MAX_SIZE_BYTES) {
    return { valid: false, error: 'File too large. Maximum size is 50MB.' }
  }

  return { valid: true, error: null }
}

/**
 * Format bytes to a human-readable string.
 * @param {number} bytes
 * @returns {string}
 */
export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Format seconds to m:ss string.
 * @param {number} seconds
 * @returns {string}
 */
export function formatDuration(seconds) {
  if (!seconds) return '--:--'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

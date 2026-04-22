import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 120_000,
})

/**
 * To check backend health and model status.
 * @returns {{ status: string, models_loaded: boolean }}
 */

export async function checkHealth() {
  const response = await apiClient.get('/api/health')
  return response.data
}

/**
 * Upload audio file
 * @param {File} file - wav or mp3 audio file
 * @param {string} domain - 'auto' | 'nature' | 'music'
 * @returns {Object} Job result with stems array
 */

export async function separateAudio(file, domain = 'auto') {
  const formData = new FormData()
  formData.append('audio', file)
  formData.append('domain', domain)

  const response = await apiClient.post('/api/separate', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  return response.data
}

/**
 * Build the full URL for a stem's audio stream.
 * The <audio> element fetches this directly.
 * @param {string} stemId
 * @returns {string}
 */

export function getStemAudioUrl(audioUrl) {
  return `${BASE_URL}${audioUrl}`
}

/**
 * Download a stem as a WAV file.
 * Creates a temporary anchor element and triggers browser download.
 * @param {string} stemId
 * @param {string} stemName
 */

export async function downloadStem(audioUrl, stemName) {
  const url = `${BASE_URL}${audioUrl}`
  const response = await fetch(url)
  if (!response.ok) throw new Error('Download failed')

  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = `${stemName.toLowerCase().replace(/\s+/g, '_')}.wav`
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(objectUrl)
}

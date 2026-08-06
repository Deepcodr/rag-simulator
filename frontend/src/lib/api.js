import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export const api = axios.create({ baseURL })

export async function ingestDocuments({ sessionId, textInput, files }) {
  const form = new FormData()
  if (sessionId) form.append('session_id', sessionId)
  if (textInput) form.append('text_input', textInput)
  ;(files || []).forEach((f) => form.append('files', f))
  const { data } = await api.post('/api/documents/ingest', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function createChunks(config) {
  const { data } = await api.post('/api/chunks', config)
  return data
}

export async function buildIndex(sessionId) {
  const { data } = await api.post('/api/index', { session_id: sessionId })
  return data
}

export async function semanticSearch({ sessionId, query, topK }) {
  const { data } = await api.post('/api/search', { session_id: sessionId, query, top_k: topK })
  return data
}

export async function generateAnswer(payload) {
  const { data } = await api.post('/api/generate', payload)
  return data
}

export async function fetchModels() {
  const { data } = await api.get('/api/models')
  return data
}

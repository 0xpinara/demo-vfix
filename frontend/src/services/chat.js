import api from './api'

/**
 * Chat session API functions
 */

export async function createSession(payload) {
  const response = await api.post('/chat/sessions', payload)
  return response.data
}

export async function getSessions(limit = 50) {
  const response = await api.get('/chat/sessions', { params: { limit } })
  return response.data
}

export async function getSession(sessionId) {
  const response = await api.get(`/chat/sessions/${sessionId}`)
  return response.data
}

export async function updateSession(sessionId, payload) {
  const response = await api.put(`/chat/sessions/${sessionId}`, payload)
  return response.data
}

export async function deleteSession(sessionId) {
  await api.delete(`/chat/sessions/${sessionId}`)
}

/**
 * Chat message API functions
 */

export async function addMessage(sessionId, payload) {
  const response = await api.post(`/chat/sessions/${sessionId}/messages`, payload)
  return response.data
}


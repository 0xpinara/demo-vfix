import api from './api'

export async function getFeedback(sessionId) {
  const response = await api.get(`/chat/feedback/${sessionId}`)
  return response.data
}

export async function saveFeedback(payload) {
  const response = await api.post('/chat/feedback', payload)
  return response.data
}


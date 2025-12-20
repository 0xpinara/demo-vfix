import api from './api'

/**
 * Submit technician feedback
 */
export async function submitTechnicianFeedback(feedbackData) {
  const response = await api.post('/technicians/feedback', feedbackData)
  return response.data
}

/**
 * Get list of feedback entries for current technician
 */
export async function getTechnicianFeedbackList(limit = 50) {
  const response = await api.get('/technicians/feedback', {
    params: { limit },
  })
  return response.data
}

/**
 * Get a specific feedback entry by ID
 */
export async function getTechnicianFeedback(feedbackId) {
  const response = await api.get(`/technicians/feedback/${feedbackId}`)
  return response.data
}


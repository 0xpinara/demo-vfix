import { describe, it, expect, vi, beforeEach } from 'vitest'
import { submitTechnicianFeedback, getTechnicianFeedbackList, getTechnicianFeedback } from '../technicianFeedback'
import api from '../api'

vi.mock('../api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}))

describe('technicianFeedback service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('submitTechnicianFeedback', () => {
    it('should submit feedback successfully', async () => {
      const feedbackData = {
        rating: 5,
        comment: 'Great!',
        diagnosis_correct: true,
      }
      const mockResponse = { data: { id: '123', ...feedbackData } }
      api.post.mockResolvedValue(mockResponse)

      const result = await submitTechnicianFeedback(feedbackData)

      expect(api.post).toHaveBeenCalledWith('/technicians/feedback', feedbackData)
      expect(result).toEqual(mockResponse.data)
    })

    it('should handle errors', async () => {
      const error = new Error('Network error')
      api.post.mockRejectedValue(error)

      await expect(submitTechnicianFeedback({ rating: 5 })).rejects.toThrow('Network error')
    })
  })

  describe('getTechnicianFeedbackList', () => {
    it('should fetch feedback list', async () => {
      const mockResponse = { data: [{ id: '1' }, { id: '2' }] }
      api.get.mockResolvedValue(mockResponse)

      const result = await getTechnicianFeedbackList(50)

      expect(api.get).toHaveBeenCalledWith('/technicians/feedback', {
        params: { limit: 50 },
      })
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('getTechnicianFeedback', () => {
    it('should fetch specific feedback', async () => {
      const feedbackId = '123'
      const mockResponse = { data: { id: feedbackId, rating: 5 } }
      api.get.mockResolvedValue(mockResponse)

      const result = await getTechnicianFeedback(feedbackId)

      expect(api.get).toHaveBeenCalledWith(`/technicians/feedback/${feedbackId}`)
      expect(result).toEqual(mockResponse.data)
    })

    it('should handle errors when fetching feedback', async () => {
      const feedbackId = '123'
      const error = new Error('Not found')
      api.get.mockRejectedValue(error)

      await expect(getTechnicianFeedback(feedbackId)).rejects.toThrow('Not found')
    })
  })

  describe('submitTechnicianFeedback', () => {
    it('should submit feedback with all fields', async () => {
      const feedbackData = {
        rating: 4,
        comment: 'Comprehensive feedback',
        diagnosis_correct: false,
        parts_sufficient: false,
        second_trip_required: true,
        actual_problem: 'Test problem',
        actual_solution: 'Test solution',
        actual_parts_needed: 'Test parts',
      }
      const mockResponse = { data: { id: '123', ...feedbackData } }
      api.post.mockResolvedValue(mockResponse)

      const result = await submitTechnicianFeedback(feedbackData)

      expect(api.post).toHaveBeenCalledWith('/technicians/feedback', feedbackData)
      expect(result).toEqual(mockResponse.data)
    })

    it('should submit feedback with minimal required fields', async () => {
      const feedbackData = {
        rating: 3,
        diagnosis_correct: true,
      }
      const mockResponse = { data: { id: '123', ...feedbackData } }
      api.post.mockResolvedValue(mockResponse)

      const result = await submitTechnicianFeedback(feedbackData)

      expect(api.post).toHaveBeenCalledWith('/technicians/feedback', feedbackData)
      expect(result).toEqual(mockResponse.data)
    })

    it('should handle API error responses', async () => {
      const feedbackData = { rating: 5, diagnosis_correct: true }
      const error = {
        response: {
          status: 400,
          data: { detail: 'Validation error' },
        },
      }
      api.post.mockRejectedValue(error)

      await expect(submitTechnicianFeedback(feedbackData)).rejects.toEqual(error)
    })
  })

  describe('getTechnicianFeedbackList', () => {
    it('should use default limit when not provided', async () => {
      const mockResponse = { data: [] }
      api.get.mockResolvedValue(mockResponse)

      await getTechnicianFeedbackList()

      expect(api.get).toHaveBeenCalledWith('/technicians/feedback', {
        params: { limit: 50 },
      })
    })

    it('should use custom limit when provided', async () => {
      const mockResponse = { data: [] }
      api.get.mockResolvedValue(mockResponse)

      await getTechnicianFeedbackList(100)

      expect(api.get).toHaveBeenCalledWith('/technicians/feedback', {
        params: { limit: 100 },
      })
    })

    it('should handle empty list response', async () => {
      const mockResponse = { data: [] }
      api.get.mockResolvedValue(mockResponse)

      const result = await getTechnicianFeedbackList()

      expect(result).toEqual([])
    })

    it('should handle errors when fetching list', async () => {
      const error = new Error('Network error')
      api.get.mockRejectedValue(error)

      await expect(getTechnicianFeedbackList()).rejects.toThrow('Network error')
    })
  })
})


import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useChat } from '../useChat'

vi.mock('@/services/feedback', () => ({
  getFeedback: vi.fn(),
  saveFeedback: vi.fn(),
}))

import { getFeedback, saveFeedback } from '@/services/feedback'

describe('useChat feedback helpers', () => {
  it('fetchFeedbackForSession caches after first load', async () => {
    getFeedback.mockResolvedValueOnce({ session_id: 's1', rating: 4 })

    const { result } = renderHook(() => useChat())

    await act(async () => {
      const res1 = await result.current.fetchFeedbackForSession('s1')
      expect(res1.rating).toBe(4)
    })

    await act(async () => {
      const res2 = await result.current.fetchFeedbackForSession('s1')
      expect(res2.rating).toBe(4)
    })

    expect(getFeedback).toHaveBeenCalledTimes(1)
    expect(result.current.feedbackBySession['s1'].rating).toBe(4)
  })

  it('submitFeedback stores the returned feedback', async () => {
    saveFeedback.mockResolvedValueOnce({ session_id: 's2', rating: 5, comment: 'Great' })

    const { result } = renderHook(() => useChat())

    await act(async () => {
      const saved = await result.current.submitFeedback({
        session_id: 's2',
        rating: 5,
        comment: 'Great',
      })
      expect(saved.rating).toBe(5)
    })

    expect(result.current.feedbackBySession['s2'].comment).toBe('Great')
    expect(saveFeedback).toHaveBeenCalledWith({ session_id: 's2', rating: 5, comment: 'Great' })
  })
})


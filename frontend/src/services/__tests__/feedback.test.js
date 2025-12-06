import { describe, it, expect, vi } from 'vitest'
import { getFeedback, saveFeedback } from '../feedback'
import api from '../api'

vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe('feedback service', () => {
  it('gets feedback for a session', async () => {
    api.get.mockResolvedValueOnce({ data: { session_id: 'abc', rating: 5 } })

    const data = await getFeedback('abc')

    expect(api.get).toHaveBeenCalledWith('/chat/feedback/abc')
    expect(data.rating).toBe(5)
  })

  it('saves feedback payload', async () => {
    const payload = { session_id: 'abc', rating: 4, comment: 'Nice' }
    api.post.mockResolvedValueOnce({ data: payload })

    const data = await saveFeedback(payload)

    expect(api.post).toHaveBeenCalledWith('/chat/feedback', payload)
    expect(data.comment).toBe('Nice')
  })
})


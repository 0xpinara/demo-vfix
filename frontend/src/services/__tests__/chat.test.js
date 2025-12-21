import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as chatService from '../chat'
import api from '../api'

vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('chat service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getSessions', () => {
    it('fetches sessions with default limit', async () => {
      const mockSessions = {
        sessions: [
          { id: '1', title: 'Session 1', message_count: 2 },
          { id: '2', title: 'Session 2', message_count: 1 },
        ],
        total: 2,
      }
      api.get.mockResolvedValueOnce({ data: mockSessions })

      const data = await chatService.getSessions()

      expect(api.get).toHaveBeenCalledWith('/chat/sessions', { params: { limit: 50 } })
      expect(data).toEqual(mockSessions)
      expect(data.sessions).toHaveLength(2)
    })

    it('fetches sessions with custom limit', async () => {
      const mockSessions = { sessions: [], total: 0 }
      api.get.mockResolvedValueOnce({ data: mockSessions })

      await chatService.getSessions(10)

      expect(api.get).toHaveBeenCalledWith('/chat/sessions', { params: { limit: 10 } })
    })

    it('handles API errors', async () => {
      const error = new Error('Network error')
      api.get.mockRejectedValueOnce(error)

      await expect(chatService.getSessions()).rejects.toThrow('Network error')
    })
  })

  describe('getSession', () => {
    it('fetches a single session with messages', async () => {
      const mockSession = {
        id: 'session-123',
        title: 'Test Session',
        message_count: 2,
        messages: [
          { id: 'msg-1', role: 'user', content: 'Hello' },
          { id: 'msg-2', role: 'assistant', content: 'Hi there' },
        ],
      }
      api.get.mockResolvedValueOnce({ data: mockSession })

      const data = await chatService.getSession('session-123')

      expect(api.get).toHaveBeenCalledWith('/chat/sessions/session-123')
      expect(data).toEqual(mockSession)
      expect(data.messages).toHaveLength(2)
    })

    it('handles session not found', async () => {
      const error = { response: { status: 404, data: { detail: 'Session not found' } } }
      api.get.mockRejectedValueOnce(error)

      await expect(chatService.getSession('nonexistent')).rejects.toEqual(error)
    })
  })

  describe('createSession', () => {
    it('creates a new session', async () => {
      const payload = { title: 'New Chat' }
      const mockSession = {
        id: 'new-session-123',
        title: 'New Chat',
        message_count: 0,
        created_at: '2025-12-20T10:00:00Z',
      }
      api.post.mockResolvedValueOnce({ data: mockSession })

      const data = await chatService.createSession(payload)

      expect(api.post).toHaveBeenCalledWith('/chat/sessions', payload)
      expect(data).toEqual(mockSession)
      expect(data.id).toBe('new-session-123')
    })

    it('creates session without title', async () => {
      const payload = {}
      const mockSession = {
        id: 'new-session-456',
        title: null,
        message_count: 0,
      }
      api.post.mockResolvedValueOnce({ data: mockSession })

      const data = await chatService.createSession(payload)

      expect(api.post).toHaveBeenCalledWith('/chat/sessions', payload)
      expect(data.title).toBeNull()
    })

    it('handles creation errors', async () => {
      const error = { response: { status: 400, data: { detail: 'Invalid payload' } } }
      api.post.mockRejectedValueOnce(error)

      await expect(chatService.createSession({})).rejects.toEqual(error)
    })
  })

  describe('addMessage', () => {
    it('adds a message to a session', async () => {
      const sessionId = 'session-123'
      const payload = {
        role: 'user',
        content: 'Test message',
      }
      const mockMessage = {
        id: 'msg-123',
        session_id: sessionId,
        role: 'user',
        content: 'Test message',
        created_at: '2025-12-20T10:00:00Z',
      }
      api.post.mockResolvedValueOnce({ data: mockMessage })

      const data = await chatService.addMessage(sessionId, payload)

      expect(api.post).toHaveBeenCalledWith(
        `/chat/sessions/${sessionId}/messages`,
        payload
      )
      expect(data).toEqual(mockMessage)
      expect(data.content).toBe('Test message')
    })

    it('adds a message with images', async () => {
      const sessionId = 'session-123'
      const payload = {
        role: 'user',
        content: 'Message with image',
        images: ['data:image/png;base64,abc123'],
      }
      const mockMessage = {
        id: 'msg-123',
        session_id: sessionId,
        role: 'user',
        content: 'Message with image',
        images: ['data:image/png;base64,abc123'],
      }
      api.post.mockResolvedValueOnce({ data: mockMessage })

      const data = await chatService.addMessage(sessionId, payload)

      expect(api.post).toHaveBeenCalledWith(
        `/chat/sessions/${sessionId}/messages`,
        payload
      )
      expect(data.images).toHaveLength(1)
    })

    it('adds a message without content (only images)', async () => {
      const sessionId = 'session-123'
      const payload = {
        role: 'user',
        images: ['data:image/png;base64,abc123'],
      }
      const mockMessage = {
        id: 'msg-123',
        session_id: sessionId,
        role: 'user',
        content: null,
        images: ['data:image/png;base64,abc123'],
      }
      api.post.mockResolvedValueOnce({ data: mockMessage })

      const data = await chatService.addMessage(sessionId, payload)

      expect(data.content).toBeNull()
      expect(data.images).toHaveLength(1)
    })

    it('handles message creation errors', async () => {
      const error = { response: { status: 404, data: { detail: 'Session not found' } } }
      api.post.mockRejectedValueOnce(error)

      await expect(
        chatService.addMessage('invalid-session', { role: 'user', content: 'Test' })
      ).rejects.toEqual(error)
    })
  })

  describe('updateSession', () => {
    it('updates a session', async () => {
      const sessionId = 'session-123'
      const payload = { title: 'Updated Title' }
      const mockSession = {
        id: sessionId,
        title: 'Updated Title',
        message_count: 5,
      }
      api.put.mockResolvedValueOnce({ data: mockSession })

      const data = await chatService.updateSession(sessionId, payload)

      expect(api.put).toHaveBeenCalledWith(`/chat/sessions/${sessionId}`, payload)
      expect(data.title).toBe('Updated Title')
    })

    it('updates session status', async () => {
      const sessionId = 'session-123'
      const payload = {
        problem_solved: true,
        technician_dispatched: true,
      }
      const mockSession = {
        id: sessionId,
        problem_solved: true,
        technician_dispatched: true,
      }
      api.put.mockResolvedValueOnce({ data: mockSession })

      const data = await chatService.updateSession(sessionId, payload)

      expect(data.problem_solved).toBe(true)
      expect(data.technician_dispatched).toBe(true)
    })

    it('handles update errors', async () => {
      const error = { response: { status: 404, data: { detail: 'Session not found' } } }
      api.put.mockRejectedValueOnce(error)

      await expect(
        chatService.updateSession('invalid-session', { title: 'Test' })
      ).rejects.toEqual(error)
    })
  })

  describe('deleteSession', () => {
    it('deletes a session', async () => {
      const sessionId = 'session-123'
      api.delete.mockResolvedValueOnce({ status: 204 })

      await chatService.deleteSession(sessionId)

      expect(api.delete).toHaveBeenCalledWith(`/chat/sessions/${sessionId}`)
    })

    it('handles deletion errors', async () => {
      const error = { response: { status: 404, data: { detail: 'Session not found' } } }
      api.delete.mockRejectedValueOnce(error)

      await expect(chatService.deleteSession('invalid-session')).rejects.toEqual(error)
    })
  })
})


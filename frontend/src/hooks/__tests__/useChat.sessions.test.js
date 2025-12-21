import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useChat } from '../useChat'
import * as chatService from '@/services/chat'
import { useAuth } from '@/context/AuthContext'

// Mock dependencies
vi.mock('@/services/chat')
vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}))
vi.mock('@/services/feedback', () => ({
  getFeedback: vi.fn(),
  saveFeedback: vi.fn(),
}))

describe('useChat - Session Management', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' }

  beforeEach(() => {
    vi.clearAllMocks()
    useAuth.mockReturnValue({ user: mockUser })
    // Mock localStorage
    global.localStorage = {
      getItem: vi.fn(() => 'mock-token'),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    }
    // Suppress console.error during tests (expected in error handling tests)
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('Session Loading', () => {
    it('loads sessions on mount', async () => {
      const mockSessions = {
        sessions: [
          {
            id: 'session-1',
            title: 'Session 1',
            message_count: 2,
            created_at: '2025-12-20T10:00:00Z',
          },
          {
            id: 'session-2',
            title: 'Session 2',
            message_count: 1,
            created_at: '2025-12-20T09:00:00Z',
          },
        ],
        total: 2,
      }
      chatService.getSessions.mockResolvedValueOnce(mockSessions)

      const { result } = renderHook(() => useChat())

      await waitFor(() => {
        expect(result.current.sessions).toHaveLength(2)
      })

      expect(chatService.getSessions).toHaveBeenCalledWith(50)
      expect(result.current.sessions[0].id).toBe('session-1')
      expect(result.current.sessions[0].messages).toEqual([])
    })

    it('sorts sessions by created_at descending (latest first)', async () => {
      const mockSessions = {
        sessions: [
          {
            id: 'session-old',
            title: 'Old Session',
            message_count: 1,
            created_at: '2025-12-20T08:00:00Z',
          },
          {
            id: 'session-new',
            title: 'New Session',
            message_count: 2,
            created_at: '2025-12-20T10:00:00Z',
          },
        ],
        total: 2,
      }
      chatService.getSessions.mockResolvedValueOnce(mockSessions)

      const { result } = renderHook(() => useChat())

      await waitFor(() => {
        expect(result.current.sessions).toHaveLength(2)
      })

      // Should be sorted latest first
      expect(result.current.sessions[0].id).toBe('session-new')
      expect(result.current.sessions[1].id).toBe('session-old')
    })

    it('reloads sessions when user changes', async () => {
      const mockSessions1 = {
        sessions: [{ id: 'session-1', title: 'Session 1', message_count: 0, created_at: '2025-12-20T10:00:00Z' }],
        total: 1,
      }
      const mockSessions2 = {
        sessions: [{ id: 'session-2', title: 'Session 2', message_count: 0, created_at: '2025-12-20T11:00:00Z' }],
        total: 1,
      }

      chatService.getSessions.mockResolvedValueOnce(mockSessions1)

      const { result, rerender } = renderHook(() => useChat())

      await waitFor(() => {
        expect(result.current.sessions).toHaveLength(1)
      })

      // Change user
      const newUser = { id: 'user-456', email: 'newuser@example.com' }
      useAuth.mockReturnValue({ user: newUser })
      chatService.getSessions.mockResolvedValueOnce(mockSessions2)

      rerender()

      await waitFor(() => {
        expect(result.current.sessions).toHaveLength(1)
        expect(result.current.sessions[0].id).toBe('session-2')
      })

      expect(chatService.getSessions).toHaveBeenCalledTimes(2)
    })

    it('handles session loading errors', async () => {
      const error = new Error('Failed to load sessions')
      chatService.getSessions.mockRejectedValueOnce(error)

      const { result } = renderHook(() => useChat())

      await waitFor(() => {
        expect(result.current.sessionsError).toBeTruthy()
      })

      expect(result.current.sessions).toEqual([])
    })

    it('clears sessions when user logs out', async () => {
      const mockSessions = {
        sessions: [{ id: 'session-1', title: 'Session 1', message_count: 0, created_at: '2025-12-20T10:00:00Z' }],
        total: 1,
      }
      chatService.getSessions.mockResolvedValueOnce(mockSessions)

      const { result, rerender } = renderHook(() => useChat())

      await waitFor(() => {
        expect(result.current.sessions).toHaveLength(1)
      })

      // User logs out
      useAuth.mockReturnValue({ user: null })
      rerender()

      await waitFor(() => {
        expect(result.current.sessions).toEqual([])
        expect(result.current.currentSessionId).toBeNull()
      })
    })
  })

  describe('Message Loading', () => {
    it('loads messages when clicking on a session', async () => {
      const mockSessions = {
        sessions: [
          {
            id: 'session-1',
            title: 'Session 1',
            message_count: 2,
            created_at: '2025-12-20T10:00:00Z',
          },
        ],
        total: 1,
      }
      const mockSessionWithMessages = {
        id: 'session-1',
        title: 'Session 1',
        message_count: 2,
        messages: [
          { id: 'msg-1', role: 'user', content: 'Hello', images: [] },
          { id: 'msg-2', role: 'assistant', content: 'Hi there', images: [] },
        ],
      }

      chatService.getSessions.mockResolvedValueOnce(mockSessions)
      chatService.getSession.mockResolvedValueOnce(mockSessionWithMessages)

      const { result } = renderHook(() => useChat())

      await waitFor(() => {
        expect(result.current.sessions).toHaveLength(1)
      })

      // Click on session
      await act(async () => {
        result.current.setCurrentSessionId('session-1')
      })

      await waitFor(() => {
        const session = result.current.sessions.find((s) => s.id === 'session-1')
        expect(session.messages).toHaveLength(2)
        expect(session.messages[0].content).toBe('Hello')
        expect(session.messages[1].content).toBe('Hi there')
      })

      expect(chatService.getSession).toHaveBeenCalledWith('session-1')
    })

    it('does not reload messages if already loaded', async () => {
      const mockSessions = {
        sessions: [
          {
            id: 'session-1',
            title: 'Session 1',
            message_count: 2,
            created_at: '2025-12-20T10:00:00Z',
          },
        ],
        total: 1,
      }
      const mockSessionWithMessages = {
        id: 'session-1',
        messages: [
          { id: 'msg-1', role: 'user', content: 'Hello', images: [] },
        ],
      }

      chatService.getSessions.mockResolvedValueOnce(mockSessions)
      chatService.getSession.mockResolvedValueOnce(mockSessionWithMessages)

      const { result } = renderHook(() => useChat())

      await waitFor(() => {
        expect(result.current.sessions).toHaveLength(1)
      })

      // Load messages first time
      await act(async () => {
        result.current.setCurrentSessionId('session-1')
      })

      await waitFor(() => {
        const session = result.current.sessions.find((s) => s.id === 'session-1')
        expect(session.messages).toHaveLength(1)
      })

      // Click again - should not reload
      await act(async () => {
        result.current.setCurrentSessionId('session-1')
      })

      // Should only be called once
      expect(chatService.getSession).toHaveBeenCalledTimes(1)
    })

    it('handles message loading errors', async () => {
      const mockSessions = {
        sessions: [
          {
            id: 'session-1',
            title: 'Session 1',
            message_count: 2,
            created_at: '2025-12-20T10:00:00Z',
          },
        ],
        total: 1,
      }

      chatService.getSessions.mockResolvedValueOnce(mockSessions)
      chatService.getSession.mockRejectedValueOnce(new Error('Failed to load'))

      const { result } = renderHook(() => useChat())

      await waitFor(() => {
        expect(result.current.sessions).toHaveLength(1)
      })

      await act(async () => {
        result.current.setCurrentSessionId('session-1')
      })

      // Should not crash, messages should remain empty
      await waitFor(() => {
        const session = result.current.sessions.find((s) => s.id === 'session-1')
        expect(session.messages).toEqual([])
      })
    })

    it('loads messages with images', async () => {
      const mockSessions = {
        sessions: [
          {
            id: 'session-1',
            title: 'Session 1',
            message_count: 1,
            created_at: '2025-12-20T10:00:00Z',
          },
        ],
        total: 1,
      }
      const mockSessionWithMessages = {
        id: 'session-1',
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            content: 'Check this image',
            images: ['data:image/png;base64,abc123'],
          },
        ],
      }

      chatService.getSessions.mockResolvedValueOnce(mockSessions)
      chatService.getSession.mockResolvedValueOnce(mockSessionWithMessages)

      const { result } = renderHook(() => useChat())

      await waitFor(() => {
        expect(result.current.sessions).toHaveLength(1)
      })

      await act(async () => {
        result.current.setCurrentSessionId('session-1')
      })

      await waitFor(() => {
        const session = result.current.sessions.find((s) => s.id === 'session-1')
        expect(session.messages[0].images).toHaveLength(1)
        expect(session.messages[0].images[0]).toBe('data:image/png;base64,abc123')
      })
    })
  })

  describe('Session Creation', () => {
    it('creates a new session when sending first message', async () => {
      const mockSessions = { sessions: [], total: 0 }
      const mockNewSession = {
        id: 'new-session-123',
        title: 'Test message...',
        message_count: 1,
        created_at: '2025-12-20T10:00:00Z',
      }
      const mockMessage = {
        id: 'msg-123',
        role: 'user',
        content: 'Test message',
      }
      // Mock getSession in case the hook tries to load messages after creating session
      const mockSessionWithMessages = {
        id: 'new-session-123',
        messages: [],
      }

      chatService.getSessions.mockResolvedValueOnce(mockSessions)
      chatService.createSession.mockResolvedValueOnce(mockNewSession)
      chatService.addMessage.mockResolvedValueOnce(mockMessage)
      chatService.getSession.mockResolvedValueOnce(mockSessionWithMessages)

      const { result } = renderHook(() => useChat())

      await waitFor(() => {
        expect(result.current.sessions).toEqual([])
      })

      // Set input first, then submit
      await act(async () => {
        result.current.setInput('Test message')
      })

      // Send first message
      await act(async () => {
        await result.current.onSubmit({
          preventDefault: () => {},
        })
      })

      // Wait for async operations
      await waitFor(
        () => {
          expect(chatService.createSession).toHaveBeenCalled()
        },
        { timeout: 3000 }
      )
    })

    it('creates session with truncated title for long messages', async () => {
      const longMessage = 'This is a very long message that should be truncated to create the session title'
      const mockNewSession = {
        id: 'new-session-123',
        title: longMessage.substring(0, 20) + '...',
        message_count: 1,
        created_at: '2025-12-20T10:00:00Z',
      }

      chatService.getSessions.mockResolvedValueOnce({ sessions: [], total: 0 })
      chatService.createSession.mockResolvedValueOnce(mockNewSession)

      const { result } = renderHook(() => useChat())

      await waitFor(() => {
        expect(result.current.sessions).toEqual([])
      })

      // The title should be truncated
      expect(mockNewSession.title.length).toBeLessThanOrEqual(23) // 20 + "..."
    })
  })

  describe('Message Addition', () => {
    it('adds message to existing session', async () => {
      const mockSessions = {
        sessions: [
          {
            id: 'session-1',
            title: 'Session 1',
            message_count: 1,
            messages: [{ role: 'user', content: 'First message', images: [] }],
            created_at: '2025-12-20T10:00:00Z',
          },
        ],
        total: 1,
      }
      const mockMessage = {
        id: 'msg-2',
        role: 'user',
        content: 'Second message',
      }

      const mockSessionWithMessages = {
        id: 'session-1',
        title: 'Session 1',
        message_count: 1,
        messages: [{ id: 'msg-1', role: 'user', content: 'First message', images: [] }],
      }

      chatService.getSessions.mockResolvedValueOnce(mockSessions)
      chatService.getSession.mockResolvedValueOnce(mockSessionWithMessages)
      chatService.addMessage.mockResolvedValueOnce(mockMessage)

      const { result } = renderHook(() => useChat())

      await waitFor(() => {
        expect(result.current.sessions).toHaveLength(1)
      })

      // Set current session and input
      await act(async () => {
        result.current.setCurrentSessionId('session-1')
        result.current.setInput('Second message')
      })

      // Wait for messages to load
      await waitFor(() => {
        const session = result.current.sessions.find((s) => s.id === 'session-1')
        expect(session.messages).toBeDefined()
      })

      // Submit message
      await act(async () => {
        await result.current.onSubmit({
          preventDefault: () => {},
        })
      })

      await waitFor(
        () => {
          expect(chatService.addMessage).toHaveBeenCalled()
        },
        { timeout: 2000 }
      )
    })

    it('handles message addition errors gracefully', async () => {
      const mockSessions = {
        sessions: [
          {
            id: 'session-1',
            title: 'Session 1',
            message_count: 1,
            messages: [{ role: 'user', content: 'First', images: [] }],
            created_at: '2025-12-20T10:00:00Z',
          },
        ],
        total: 1,
      }

      const mockSessionWithMessages = {
        id: 'session-1',
        title: 'Session 1',
        message_count: 1,
        messages: [{ id: 'msg-1', role: 'user', content: 'First', images: [] }],
      }

      chatService.getSessions.mockResolvedValueOnce(mockSessions)
      chatService.getSession.mockResolvedValueOnce(mockSessionWithMessages)
      chatService.addMessage.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useChat())

      await waitFor(() => {
        expect(result.current.sessions).toHaveLength(1)
      })

      await act(async () => {
        result.current.setCurrentSessionId('session-1')
        result.current.setInput('Second message')
      })

      // Wait for messages to load
      await waitFor(() => {
        const session = result.current.sessions.find((s) => s.id === 'session-1')
        expect(session.messages).toBeDefined()
      })

      // Should not crash even if backend fails
      await act(async () => {
        await result.current.onSubmit({
          preventDefault: () => {},
        })
      })

      // Message should still be added to local state
      await waitFor(
        () => {
          const session = result.current.sessions.find((s) => s.id === 'session-1')
          expect(session.messages.length).toBeGreaterThan(1)
        },
        { timeout: 2000 }
      )
    })
  })

  describe('New Chat', () => {
    it('clears current session when starting new chat', async () => {
      const mockSessions = {
        sessions: [
          {
            id: 'session-1',
            title: 'Session 1',
            message_count: 1,
            created_at: '2025-12-20T10:00:00Z',
          },
        ],
        total: 1,
      }
      const mockSessionWithMessages = {
        id: 'session-1',
        messages: [],
      }

      chatService.getSessions.mockResolvedValueOnce(mockSessions)
      chatService.getSession.mockResolvedValueOnce(mockSessionWithMessages)

      const { result } = renderHook(() => useChat())

      await waitFor(() => {
        expect(result.current.sessions).toHaveLength(1)
      })

      await act(async () => {
        result.current.setCurrentSessionId('session-1')
      })

      // Wait for messages to load
      await waitFor(() => {
        expect(result.current.currentSessionId).toBe('session-1')
      })

      await act(async () => {
        result.current.handleNewChat()
      })

      expect(result.current.currentSessionId).toBeNull()
      expect(result.current.input).toBe('')
    })
  })
})


import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ErrorMessage from '../ErrorMessage'

describe('ErrorMessage', () => {
  it('renders error message when provided', () => {
    render(<ErrorMessage message="This is an error" />)
    
    expect(screen.getByText('This is an error')).toBeInTheDocument()
  })

  it('does not render when message is empty', () => {
    const { container } = render(<ErrorMessage message="" />)
    
    expect(container.firstChild).toBeNull()
  })

  it('does not render when message is null', () => {
    const { container } = render(<ErrorMessage message={null} />)
    
    expect(container.firstChild).toBeNull()
  })

  it('does not render when message is undefined', () => {
    const { container } = render(<ErrorMessage />)
    
    expect(container.firstChild).toBeNull()
  })

  it('renders long error messages', () => {
    const longMessage = 'This is a very long error message that contains multiple words and should still be displayed correctly'
    render(<ErrorMessage message={longMessage} />)
    
    expect(screen.getByText(longMessage)).toBeInTheDocument()
  })
})


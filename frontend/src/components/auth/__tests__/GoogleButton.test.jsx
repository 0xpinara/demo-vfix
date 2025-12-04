import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import GoogleButton from '../GoogleButton'

describe('GoogleButton', () => {
  it('renders Google button', () => {
    render(<GoogleButton onClick={() => {}} />)
    
    expect(screen.getByRole('button', { name: /google ile devam et/i })).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<GoogleButton onClick={handleClick} />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('has Google icon SVG', () => {
    render(<GoogleButton onClick={() => {}} />)
    
    const button = screen.getByRole('button')
    const svg = button.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveClass('google-icon')
  })

  it('has correct button text', () => {
    render(<GoogleButton onClick={() => {}} />)
    
    expect(screen.getByText('Google ile devam et')).toBeInTheDocument()
  })
})


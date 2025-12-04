import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AuthButton from '../AuthButton'

describe('AuthButton', () => {
  it('renders button with children', () => {
    render(<AuthButton>Click Me</AuthButton>)
    
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<AuthButton onClick={handleClick}>Click Me</AuthButton>)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('shows loading state', () => {
    render(<AuthButton loading>Click Me</AuthButton>)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    // When loading, the text is replaced with a spinner
    expect(screen.queryByText(/click me/i)).not.toBeInTheDocument()
    // Check for spinner element
    expect(button.querySelector('.spinner')).toBeInTheDocument()
  })

  it('is disabled when disabled prop is true', () => {
    render(<AuthButton disabled>Click Me</AuthButton>)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('is disabled when loading', () => {
    render(<AuthButton loading>Click Me</AuthButton>)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('applies custom className', () => {
    render(<AuthButton className="custom-class">Click Me</AuthButton>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })

  it('renders secondary button without arrow icon', () => {
    render(<AuthButton className="secondary">Back</AuthButton>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('secondary')
  })

  it('passes through other props', () => {
    render(<AuthButton type="submit" data-testid="submit-btn">Submit</AuthButton>)
    
    const button = screen.getByTestId('submit-btn')
    expect(button).toHaveAttribute('type', 'submit')
  })
})


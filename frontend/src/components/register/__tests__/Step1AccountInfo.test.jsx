import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Step1AccountInfo from '../Step1AccountInfo'

describe('Step1AccountInfo', () => {
  const defaultProps = {
    formData: {
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
    },
    errors: {},
    onInputChange: vi.fn(),
    onNext: vi.fn(),
  }

  it('renders all form fields', () => {
    render(<Step1AccountInfo {...defaultProps} />)
    
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
  })

  it('displays form data values', () => {
    const props = {
      ...defaultProps,
      formData: {
        email: 'test@example.com',
        username: 'testuser',
        password: 'testpass123',
        confirmPassword: 'testpass123',
      },
    }
    render(<Step1AccountInfo {...props} />)
    
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('testuser')).toBeInTheDocument()
    // Password and confirmPassword both have the same value, so use getAllByDisplayValue
    const passwordInputs = screen.getAllByDisplayValue('testpass123')
    expect(passwordInputs.length).toBe(2)
  })

  it('calls onInputChange when input changes', () => {
    const onInputChange = vi.fn()
    render(<Step1AccountInfo {...defaultProps} onInputChange={onInputChange} />)
    
    const emailInput = screen.getByLabelText(/email address/i)
    fireEvent.change(emailInput, { target: { value: 'new@example.com' } })
    
    expect(onInputChange).toHaveBeenCalled()
  })

  it('displays error messages', () => {
    const props = {
      ...defaultProps,
      errors: {
        email: 'Email is invalid',
        password: 'Password is too short',
      },
    }
    render(<Step1AccountInfo {...props} />)
    
    expect(screen.getByText('Email is invalid')).toBeInTheDocument()
    expect(screen.getByText('Password is too short')).toBeInTheDocument()
  })

  it('calls onNext when continue button is clicked', () => {
    const onNext = vi.fn()
    render(<Step1AccountInfo {...defaultProps} onNext={onNext} />)
    
    const continueButton = screen.getByRole('button', { name: /continue/i })
    fireEvent.click(continueButton)
    
    expect(onNext).toHaveBeenCalledTimes(1)
  })

  it('has required attributes on inputs', () => {
    render(<Step1AccountInfo {...defaultProps} />)
    
    const emailInput = screen.getByLabelText(/email address/i)
    const usernameInput = screen.getByLabelText(/username/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    
    expect(emailInput).toBeRequired()
    expect(usernameInput).toBeRequired()
    expect(passwordInput).toBeRequired()
    expect(confirmPasswordInput).toBeRequired()
  })
})


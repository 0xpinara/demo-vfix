import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Step2PersonalInfo from '../Step2PersonalInfo'

describe('Step2PersonalInfo', () => {
  const defaultProps = {
    formData: {
      full_name: '',
      address: '',
      phone: '',
      preferred_contact_method: 'email',
      skill_level: 1,
      age_verified: false,
    },
    errors: {},
    onInputChange: vi.fn(),
    setFormData: vi.fn(),
    onBack: vi.fn(),
    onNext: vi.fn(),
  }

  it('renders all form fields', () => {
    render(<Step2PersonalInfo {...defaultProps} />)
    
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/preferred contact method/i)).toBeInTheDocument()
    // Skill Level is a label but not associated with an input, so use getByText
    expect(screen.getByText(/skill level/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/i confirm that i am at least 18/i)).toBeInTheDocument()
  })

  it('displays form data values', () => {
    const props = {
      ...defaultProps,
      formData: {
        full_name: 'John Doe',
        address: '123 Main St',
        phone: '+905551234567',
        preferred_contact_method: 'phone',
        skill_level: 3,
        age_verified: true,
      },
    }
    render(<Step2PersonalInfo {...props} />)
    
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
    expect(screen.getByDisplayValue('123 Main St')).toBeInTheDocument()
    expect(screen.getByDisplayValue('+905551234567')).toBeInTheDocument()
  })

  it('calls onInputChange when input changes', () => {
    const onInputChange = vi.fn()
    render(<Step2PersonalInfo {...defaultProps} onInputChange={onInputChange} />)
    
    const fullNameInput = screen.getByLabelText(/full name/i)
    fireEvent.change(fullNameInput, { target: { value: 'New Name' } })
    
    expect(onInputChange).toHaveBeenCalled()
  })

  it('displays error messages', () => {
    const props = {
      ...defaultProps,
      errors: {
        full_name: 'Full name is required',
        age_verified: 'You must verify your age',
      },
    }
    render(<Step2PersonalInfo {...props} />)
    
    expect(screen.getByText('Full name is required')).toBeInTheDocument()
    expect(screen.getByText('You must verify your age')).toBeInTheDocument()
  })

  it('calls onBack when back button is clicked', () => {
    const onBack = vi.fn()
    render(<Step2PersonalInfo {...defaultProps} onBack={onBack} />)
    
    const backButton = screen.getByRole('button', { name: /back/i })
    fireEvent.click(backButton)
    
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('calls onNext when continue button is clicked', () => {
    const onNext = vi.fn()
    render(<Step2PersonalInfo {...defaultProps} onNext={onNext} />)
    
    const continueButton = screen.getByRole('button', { name: /continue/i })
    fireEvent.click(continueButton)
    
    expect(onNext).toHaveBeenCalledTimes(1)
  })

  it('allows selecting skill level', () => {
    const setFormData = vi.fn()
    render(<Step2PersonalInfo {...defaultProps} setFormData={setFormData} />)
    
    const skillButton = screen.getByRole('button', { name: '3' })
    fireEvent.click(skillButton)
    
    expect(setFormData).toHaveBeenCalled()
  })

  it('shows all skill level buttons', () => {
    render(<Step2PersonalInfo {...defaultProps} />)
    
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByRole('button', { name: String(i) })).toBeInTheDocument()
    }
  })

  it('highlights active skill level', () => {
    const props = {
      ...defaultProps,
      formData: {
        ...defaultProps.formData,
        skill_level: 3,
      },
    }
    render(<Step2PersonalInfo {...props} />)
    
    const skillButton = screen.getByRole('button', { name: '3' })
    expect(skillButton).toHaveClass('active')
  })
})


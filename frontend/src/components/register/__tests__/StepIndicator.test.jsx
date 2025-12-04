import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StepIndicator from '../StepIndicator'

describe('StepIndicator', () => {
  it('renders all steps', () => {
    render(<StepIndicator currentStep={1} totalSteps={3} />)
    
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('highlights current step', () => {
    render(<StepIndicator currentStep={2} totalSteps={3} />)
    
    // The class is on the parent div with class "step", not the step-number div
    const step2Number = screen.getByText('2')
    const step2 = step2Number.closest('.step')
    expect(step2).toHaveClass('active')
  })

  it('marks completed steps', () => {
    render(<StepIndicator currentStep={3} totalSteps={3} />)
    
    // All steps up to currentStep should have 'active' class
    const step1Number = screen.getByText('1')
    const step2Number = screen.getByText('2')
    const step3Number = screen.getByText('3')
    
    const step1 = step1Number.closest('.step')
    const step2 = step2Number.closest('.step')
    const step3 = step3Number.closest('.step')
    
    // All steps <= currentStep have 'active' class
    expect(step1).toHaveClass('active')
    expect(step2).toHaveClass('active')
    expect(step3).toHaveClass('active')
  })

  it('handles first step correctly', () => {
    render(<StepIndicator currentStep={1} totalSteps={3} />)
    
    const step1Number = screen.getByText('1')
    const step1 = step1Number.closest('.step')
    expect(step1).toHaveClass('active')
  })

  it('handles last step correctly', () => {
    render(<StepIndicator currentStep={3} totalSteps={3} />)
    
    const step3Number = screen.getByText('3')
    const step3 = step3Number.closest('.step')
    expect(step3).toHaveClass('active')
  })
})


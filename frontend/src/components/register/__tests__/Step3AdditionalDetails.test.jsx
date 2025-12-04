import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Step3AdditionalDetails from '../Step3AdditionalDetails'

describe('Step3AdditionalDetails', () => {
  const defaultProps = {
    formData: {
      referral_source: '',
      available_tools: [],
      owned_products: [],
      gdpr_consent: false,
    },
    errors: {},
    onInputChange: vi.fn(),
    addProduct: vi.fn(),
    updateProduct: vi.fn(),
    removeProduct: vi.fn(),
    toggleTool: vi.fn(),
    onBack: vi.fn(),
    loading: false,
  }

  it('renders all form fields', () => {
    render(<Step3AdditionalDetails {...defaultProps} />)
    
    expect(screen.getByLabelText(/how did you hear about us/i)).toBeInTheDocument()
    expect(screen.getByText(/available tools/i)).toBeInTheDocument()
    expect(screen.getByText(/owned products/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/i agree to the gdpr/i)).toBeInTheDocument()
  })

  it('displays referral source options', () => {
    render(<Step3AdditionalDetails {...defaultProps} />)
    
    const select = screen.getByLabelText(/how did you hear about us/i)
    expect(select).toBeInTheDocument()
    
    fireEvent.click(select)
    expect(screen.getByText('Google Search')).toBeInTheDocument()
    expect(screen.getByText('Social Media')).toBeInTheDocument()
  })

  it('calls onInputChange when referral source changes', () => {
    const onInputChange = vi.fn()
    render(<Step3AdditionalDetails {...defaultProps} onInputChange={onInputChange} />)
    
    const select = screen.getByLabelText(/how did you hear about us/i)
    fireEvent.change(select, { target: { value: 'google' } })
    
    expect(onInputChange).toHaveBeenCalled()
  })

  it('displays available tools', () => {
    render(<Step3AdditionalDetails {...defaultProps} />)
    
    const tools = ['screwdriver', 'multimeter', 'wrench', 'pliers', 'drill', 'soldering iron']
    tools.forEach(tool => {
      expect(screen.getByText(tool)).toBeInTheDocument()
    })
  })

  it('calls toggleTool when tool is clicked', () => {
    const toggleTool = vi.fn()
    render(<Step3AdditionalDetails {...defaultProps} toggleTool={toggleTool} />)
    
    const toolButton = screen.getByRole('button', { name: /screwdriver/i })
    fireEvent.click(toolButton)
    
    expect(toggleTool).toHaveBeenCalledWith('screwdriver')
  })

  it('highlights selected tools', () => {
    const props = {
      ...defaultProps,
      formData: {
        ...defaultProps.formData,
        available_tools: ['screwdriver', 'multimeter'],
      },
    }
    render(<Step3AdditionalDetails {...props} />)
    
    const screwdriverButton = screen.getByRole('button', { name: /screwdriver/i })
    expect(screwdriverButton).toHaveClass('active')
  })

  it('calls addProduct when add product button is clicked', () => {
    const addProduct = vi.fn()
    render(<Step3AdditionalDetails {...defaultProps} addProduct={addProduct} />)
    
    const addButton = screen.getByRole('button', { name: /add product/i })
    fireEvent.click(addButton)
    
    expect(addProduct).toHaveBeenCalledTimes(1)
  })

  it('displays owned products', () => {
    const props = {
      ...defaultProps,
      formData: {
        ...defaultProps.formData,
        owned_products: [
          { brand: 'Bosch', model: 'Model1' },
          { brand: 'Samsung', model: 'Model2' },
        ],
      },
    }
    render(<Step3AdditionalDetails {...props} />)
    
    expect(screen.getByDisplayValue('Bosch')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Model1')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Samsung')).toBeInTheDocument()
  })

  it('calls updateProduct when product field changes', () => {
    const updateProduct = vi.fn()
    const props = {
      ...defaultProps,
      formData: {
        ...defaultProps.formData,
        owned_products: [{ brand: '', model: '' }],
      },
    }
    render(<Step3AdditionalDetails {...props} updateProduct={updateProduct} />)
    
    const brandInput = screen.getByPlaceholderText(/brand/i)
    fireEvent.change(brandInput, { target: { value: 'New Brand' } })
    
    expect(updateProduct).toHaveBeenCalled()
  })

  it('calls removeProduct when remove button is clicked', () => {
    const removeProduct = vi.fn()
    const props = {
      ...defaultProps,
      formData: {
        ...defaultProps.formData,
        owned_products: [{ brand: 'Brand', model: 'Model' }],
      },
    }
    render(<Step3AdditionalDetails {...props} removeProduct={removeProduct} />)
    
    const removeButton = screen.getByRole('button', { name: /×/i })
    fireEvent.click(removeButton)
    
    expect(removeProduct).toHaveBeenCalled()
  })

  it('displays GDPR consent checkbox', () => {
    render(<Step3AdditionalDetails {...defaultProps} />)
    
    const checkbox = screen.getByLabelText(/i agree to the gdpr/i)
    expect(checkbox).toBeInTheDocument()
    expect(checkbox).toBeRequired()
  })

  it('displays error messages', () => {
    const props = {
      ...defaultProps,
      errors: {
        gdpr_consent: 'GDPR consent is required',
        submit: 'Registration failed',
      },
    }
    render(<Step3AdditionalDetails {...props} />)
    
    expect(screen.getByText('GDPR consent is required')).toBeInTheDocument()
    expect(screen.getByText('Registration failed')).toBeInTheDocument()
  })

  it('calls onBack when back button is clicked', () => {
    const onBack = vi.fn()
    render(<Step3AdditionalDetails {...defaultProps} onBack={onBack} />)
    
    const backButton = screen.getByRole('button', { name: /back/i })
    fireEvent.click(backButton)
    
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('shows loading state on submit button', () => {
    const { container } = render(<Step3AdditionalDetails {...defaultProps} loading={true} />)
    
    // When loading, the button text is replaced with spinner, so find by type
    const submitButton = container.querySelector('button[type="submit"]')
    expect(submitButton).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
    // Check that spinner is shown
    expect(submitButton.querySelector('.spinner')).toBeInTheDocument()
  })
})


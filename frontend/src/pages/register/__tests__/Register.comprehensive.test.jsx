import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Register from '../Register'
import { AuthProvider } from '../../../context/AuthContext'
import api from '../../../services/api'

const mockNavigate = vi.fn()

vi.mock('../../../services/api')
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  )
}

describe('Register Comprehensive', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('validates username length', async () => {
    renderWithProviders(<Register />)
    
    const usernameInput = screen.getByLabelText(/username/i)
    const continueButton = screen.getByRole('button', { name: /continue/i })

    fireEvent.change(usernameInput, { target: { value: 'ab' } })
    fireEvent.click(continueButton)

    await waitFor(() => {
      expect(screen.getByText(/username must be at least 3 characters/i)).toBeInTheDocument()
    })
  })

  it('validates password complexity', async () => {
    renderWithProviders(<Register />)
    
    const passwordInput = screen.getByLabelText(/^password$/i)
    const continueButton = screen.getByRole('button', { name: /continue/i })

    fireEvent.change(passwordInput, { target: { value: 'onlyletters' } })
    fireEvent.click(continueButton)

    await waitFor(() => {
      expect(screen.getByText(/password must contain letters and numbers/i)).toBeInTheDocument()
    })
  })

  it('allows navigation between steps', async () => {
    renderWithProviders(<Register />)
    
    // Fill step 1
    const emailInput = screen.getByLabelText(/email address/i)
    const usernameInput = screen.getByLabelText(/username/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    let continueButton = screen.getByRole('button', { name: /continue/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(usernameInput, { target: { value: 'testuser' } })
    fireEvent.change(passwordInput, { target: { value: 'testpass123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'testpass123' } })
    fireEvent.click(continueButton)

    await waitFor(() => {
      expect(screen.getByText(/personal information/i)).toBeInTheDocument()
    })

    // Go back
    const backButton = screen.getByRole('button', { name: /back/i })
    fireEvent.click(backButton)

    await waitFor(() => {
      expect(screen.getByText(/account information/i)).toBeInTheDocument()
    })
  })

  it('validates step 2 required fields', async () => {
    renderWithProviders(<Register />)
    
    // Navigate to step 2
    const emailInput = screen.getByLabelText(/email address/i)
    const usernameInput = screen.getByLabelText(/username/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    let continueButton = screen.getByRole('button', { name: /continue/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(usernameInput, { target: { value: 'testuser' } })
    fireEvent.change(passwordInput, { target: { value: 'testpass123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'testpass123' } })
    fireEvent.click(continueButton)

    await waitFor(() => {
      expect(screen.getByText(/personal information/i)).toBeInTheDocument()
    })

    // Try to continue without required fields
    continueButton = screen.getByRole('button', { name: /continue/i })
    fireEvent.click(continueButton)

    await waitFor(() => {
      expect(screen.getByText(/full name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/you must verify your age/i)).toBeInTheDocument()
    })
  })

  it('handles skill level selection', async () => {
    renderWithProviders(<Register />)
    
    // Navigate to step 2
    const emailInput = screen.getByLabelText(/email address/i)
    const usernameInput = screen.getByLabelText(/username/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    let continueButton = screen.getByRole('button', { name: /continue/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(usernameInput, { target: { value: 'testuser' } })
    fireEvent.change(passwordInput, { target: { value: 'testpass123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'testpass123' } })
    fireEvent.click(continueButton)

    await waitFor(() => {
      expect(screen.getByText(/personal information/i)).toBeInTheDocument()
    })

    // Select skill level
    const skillButton = screen.getByRole('button', { name: '4' })
    fireEvent.click(skillButton)

    expect(skillButton).toHaveClass('active')
  })

  it('handles tool selection', async () => {
    renderWithProviders(<Register />)
    
    // Navigate to step 3
    const emailInput = screen.getByLabelText(/email address/i)
    const usernameInput = screen.getByLabelText(/username/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    let continueButton = screen.getByRole('button', { name: /continue/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(usernameInput, { target: { value: 'testuser' } })
    fireEvent.change(passwordInput, { target: { value: 'testpass123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'testpass123' } })
    fireEvent.click(continueButton)

    await waitFor(() => {
      expect(screen.getByText(/personal information/i)).toBeInTheDocument()
    })

    const fullNameInput = screen.getByLabelText(/full name/i)
    const ageCheckbox = screen.getByLabelText(/i confirm that i am at least 18/i)
    continueButton = screen.getByRole('button', { name: /continue/i })

    fireEvent.change(fullNameInput, { target: { value: 'Test User' } })
    fireEvent.click(ageCheckbox)
    fireEvent.click(continueButton)

    await waitFor(() => {
      expect(screen.getByText(/additional details/i)).toBeInTheDocument()
    })

    // Select a tool
    const toolButton = screen.getByRole('button', { name: /screwdriver/i })
    fireEvent.click(toolButton)

    expect(toolButton).toHaveClass('active')
  })

  it('handles product addition and removal', async () => {
    renderWithProviders(<Register />)
    
    // Navigate to step 3
    const emailInput = screen.getByLabelText(/email address/i)
    const usernameInput = screen.getByLabelText(/username/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    let continueButton = screen.getByRole('button', { name: /continue/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(usernameInput, { target: { value: 'testuser' } })
    fireEvent.change(passwordInput, { target: { value: 'testpass123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'testpass123' } })
    fireEvent.click(continueButton)

    await waitFor(() => {
      expect(screen.getByText(/personal information/i)).toBeInTheDocument()
    })

    const fullNameInput = screen.getByLabelText(/full name/i)
    const ageCheckbox = screen.getByLabelText(/i confirm that i am at least 18/i)
    continueButton = screen.getByRole('button', { name: /continue/i })

    fireEvent.change(fullNameInput, { target: { value: 'Test User' } })
    fireEvent.click(ageCheckbox)
    fireEvent.click(continueButton)

    await waitFor(() => {
      expect(screen.getByText(/additional details/i)).toBeInTheDocument()
    })

    // Add product
    const addProductButton = screen.getByRole('button', { name: /add product/i })
    fireEvent.click(addProductButton)

    await waitFor(() => {
      const brandInputs = screen.getAllByPlaceholderText(/brand/i)
      expect(brandInputs.length).toBeGreaterThan(0)
    })

    // Fill product
    const brandInput = screen.getByPlaceholderText(/brand/i)
    const modelInput = screen.getByPlaceholderText(/model/i)
    fireEvent.change(brandInput, { target: { value: 'Bosch' } })
    fireEvent.change(modelInput, { target: { value: 'Model1' } })

    // Remove product
    const removeButton = screen.getByRole('button', { name: /×/i })
    fireEvent.click(removeButton)

    await waitFor(() => {
      expect(screen.queryByDisplayValue('Bosch')).not.toBeInTheDocument()
    })
  })

  it('handles registration errors from server', async () => {
    api.post.mockRejectedValueOnce({
      response: {
        data: {
          detail: 'An account with this email or username already exists.',
        },
      },
    })

    renderWithProviders(<Register />)
    
    // Fill all steps and submit
    const emailInput = screen.getByLabelText(/email address/i)
    const usernameInput = screen.getByLabelText(/username/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    let continueButton = screen.getByRole('button', { name: /continue/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(usernameInput, { target: { value: 'testuser' } })
    fireEvent.change(passwordInput, { target: { value: 'testpass123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'testpass123' } })
    fireEvent.click(continueButton)

    await waitFor(() => {
      expect(screen.getByText(/personal information/i)).toBeInTheDocument()
    })

    const fullNameInput = screen.getByLabelText(/full name/i)
    const ageCheckbox = screen.getByLabelText(/i confirm that i am at least 18/i)
    continueButton = screen.getByRole('button', { name: /continue/i })

    fireEvent.change(fullNameInput, { target: { value: 'Test User' } })
    fireEvent.click(ageCheckbox)
    fireEvent.click(continueButton)

    await waitFor(() => {
      expect(screen.getByText(/additional details/i)).toBeInTheDocument()
    })

    const gdprCheckbox = screen.getByLabelText(/i agree to the gdpr/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })

    fireEvent.click(gdprCheckbox)
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/already exists/i)).toBeInTheDocument()
    })
  })
})


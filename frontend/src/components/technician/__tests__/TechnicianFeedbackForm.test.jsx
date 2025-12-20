import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import TechnicianFeedbackForm from '../TechnicianFeedbackForm'
import * as technicianFeedbackService from '@/services/technicianFeedback'

vi.mock('@/services/technicianFeedback', () => ({
  submitTechnicianFeedback: vi.fn(),
}))

describe('TechnicianFeedbackForm', () => {
  const mockOnSuccess = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders form fields', () => {
    render(<TechnicianFeedbackForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

    expect(screen.getByText('Teknisyen Geri Bildirimi')).toBeInTheDocument()
    expect(screen.getByText(/genel değerlendirme/i)).toBeInTheDocument()
    expect(screen.getByText(/genel yorum/i)).toBeInTheDocument()
  })

  it('requires rating before submission', async () => {
    render(<TechnicianFeedbackForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

    const submitButton = screen.getByRole('button', { name: /geri bildirimi gönder/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/lütfen 1-5 arasında bir puan seçin/i)).toBeInTheDocument()
    })
    expect(technicianFeedbackService.submitTechnicianFeedback).not.toHaveBeenCalled()
  })

  it('submits feedback successfully', async () => {
    technicianFeedbackService.submitTechnicianFeedback.mockResolvedValue({
      id: '123',
      rating: 5,
    })

    render(<TechnicianFeedbackForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

    // Select rating
    const starButtons = screen.getAllByLabelText(/yıldız/i)
    fireEvent.click(starButtons[4]) // 5 stars

    // Submit
    const submitButton = screen.getByRole('button', { name: /geri bildirimi gönder/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(technicianFeedbackService.submitTechnicianFeedback).toHaveBeenCalled()
    })

    // Component has a 1500ms delay before calling onSuccess
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled()
    }, { timeout: 2000 })
  })

  it('shows actual findings section when diagnosis is incorrect', () => {
    render(<TechnicianFeedbackForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

    const diagnosisCheckbox = screen.getByLabelText(/ai tanısı doğruydu/i)
    fireEvent.click(diagnosisCheckbox)

    expect(screen.getByText(/gerçek bulgular/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/gerçek sorun neydi/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/gerçek çözüm neydi/i)).toBeInTheDocument()
  })

  it('shows required parts section when parts are not sufficient', () => {
    render(<TechnicianFeedbackForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

    const partsCheckbox = screen.getByLabelText(/önerilen parçalar yeterliydi/i)
    fireEvent.click(partsCheckbox)

    expect(screen.getByText(/gerekli parçalar/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/gerçekte gerekli olan parçalar/i)).toBeInTheDocument()
  })

  it('hides required parts section when parts are sufficient', () => {
    render(<TechnicianFeedbackForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

    const partsCheckbox = screen.getByLabelText(/önerilen parçalar yeterliydi/i)
    // Initially checked, so section should not be visible
    expect(screen.queryByText(/gerekli parçalar/i)).not.toBeInTheDocument()

    // Uncheck to show section
    fireEvent.click(partsCheckbox)
    expect(screen.getByText(/gerekli parçalar/i)).toBeInTheDocument()

    // Check again to hide section
    fireEvent.click(partsCheckbox)
    expect(screen.queryByText(/gerekli parçalar/i)).not.toBeInTheDocument()
  })

  it('renders all form fields', () => {
    render(<TechnicianFeedbackForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

    expect(screen.getByText('Teknisyen Geri Bildirimi')).toBeInTheDocument()
    expect(screen.getByText(/genel değerlendirme/i)).toBeInTheDocument()
    expect(screen.getByText(/genel yorum/i)).toBeInTheDocument()
    expect(screen.getByText(/ai tanısı doğruydu/i)).toBeInTheDocument()
    expect(screen.getByText(/önerilen parçalar yeterliydi/i)).toBeInTheDocument()
    // Use getElementById for Turkish İ character issue
    expect(document.getElementById('second_trip_required')).toBeInTheDocument()
  })

  it('allows selecting star rating', () => {
    render(<TechnicianFeedbackForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

    const starButtons = screen.getAllByLabelText(/yıldız/i)
    expect(starButtons).toHaveLength(5)

    // Click on 3rd star (rating 3)
    fireEvent.click(starButtons[2])
    expect(screen.getByText('3/5')).toBeInTheDocument()

    // Click on 5th star (rating 5)
    fireEvent.click(starButtons[4])
    expect(screen.getByText('5/5')).toBeInTheDocument()
  })

  it('allows typing in comment textarea', () => {
    render(<TechnicianFeedbackForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

    const commentTextarea = screen.getByPlaceholderText(/deneyiminiz hakkında/i)
    fireEvent.change(commentTextarea, { target: { value: 'Test comment' } })

    expect(commentTextarea.value).toBe('Test comment')
  })

  it('validates required fields when diagnosis is incorrect', async () => {
    render(<TechnicianFeedbackForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

    // Select rating
    const starButtons = screen.getAllByLabelText(/yıldız/i)
    fireEvent.click(starButtons[4])

    // Uncheck diagnosis correct
    const diagnosisCheckbox = screen.getByLabelText(/ai tanısı doğruydu/i)
    fireEvent.click(diagnosisCheckbox)

    // Try to submit without required fields - HTML5 validation prevents submission
    const submitButton = screen.getByRole('button', { name: /geri bildirimi gönder/i })
    fireEvent.click(submitButton)

    // The form submission should be prevented (HTML5 required validation or JS validation)
    expect(technicianFeedbackService.submitTechnicianFeedback).not.toHaveBeenCalled()
  })

  it('submits successfully when diagnosis incorrect but required fields are filled', async () => {
    technicianFeedbackService.submitTechnicianFeedback.mockResolvedValue({
      id: '123',
      rating: 3,
    })

    render(<TechnicianFeedbackForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

    // Select rating
    const starButtons = screen.getAllByLabelText(/yıldız/i)
    fireEvent.click(starButtons[2])

    // Uncheck diagnosis correct
    const diagnosisCheckbox = screen.getByLabelText(/ai tanısı doğruydu/i)
    fireEvent.click(diagnosisCheckbox)

    // Fill required fields
    const actualProblem = screen.getByPlaceholderText(/gerçek sorun neydi/i)
    const actualSolution = screen.getByPlaceholderText(/gerçek çözüm neydi/i)
    fireEvent.change(actualProblem, { target: { value: 'Test problem' } })
    fireEvent.change(actualSolution, { target: { value: 'Test solution' } })

    // Submit
    const submitButton = screen.getByRole('button', { name: /geri bildirimi gönder/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(technicianFeedbackService.submitTechnicianFeedback).toHaveBeenCalled()
    })
  })

  it('handles form submission with all fields', async () => {
    technicianFeedbackService.submitTechnicianFeedback.mockResolvedValue({
      id: '123',
      rating: 4,
    })

    render(<TechnicianFeedbackForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

    // Fill all fields
    const starButtons = screen.getAllByLabelText(/yıldız/i)
    fireEvent.click(starButtons[3]) // 4 stars

    const commentTextarea = screen.getByPlaceholderText(/deneyiminiz hakkında/i)
    fireEvent.change(commentTextarea, { target: { value: 'Full feedback' } })

    const partsCheckbox = screen.getByLabelText(/önerilen parçalar yeterliydi/i)
    fireEvent.click(partsCheckbox) // Uncheck

    const actualParts = screen.getByPlaceholderText(/gerçekte gerekli olan parçalar/i)
    fireEvent.change(actualParts, { target: { value: 'Additional parts' } })

    // Submit
    const submitButton = screen.getByRole('button', { name: /geri bildirimi gönder/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(technicianFeedbackService.submitTechnicianFeedback).toHaveBeenCalledWith(
        expect.objectContaining({
          rating: 4,
          comment: 'Full feedback',
          parts_sufficient: false,
          actual_parts_needed: 'Additional parts',
        })
      )
    })
  })

  it('shows loading state during submission', async () => {
    technicianFeedbackService.submitTechnicianFeedback.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ id: '123' }), 100))
    )

    render(<TechnicianFeedbackForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

    const starButtons = screen.getAllByLabelText(/yıldız/i)
    fireEvent.click(starButtons[4])

    const submitButton = screen.getByRole('button', { name: /geri bildirimi gönder/i })
    fireEvent.click(submitButton)

    expect(screen.getByText(/gönderiliyor/i)).toBeInTheDocument()
    expect(submitButton).toBeDisabled()

    await waitFor(() => {
      expect(screen.queryByText(/gönderiliyor/i)).not.toBeInTheDocument()
    })
  })

  it('shows error message on submission failure', async () => {
    const errorMessage = 'Network error occurred'
    technicianFeedbackService.submitTechnicianFeedback.mockRejectedValue({
      response: { data: { detail: errorMessage } },
    })

    render(<TechnicianFeedbackForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

    const starButtons = screen.getAllByLabelText(/yıldız/i)
    fireEvent.click(starButtons[4])

    const submitButton = screen.getByRole('button', { name: /geri bildirimi gönder/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
    expect(mockOnSuccess).not.toHaveBeenCalled()
  })

  it('shows generic error message when error has no detail', async () => {
    technicianFeedbackService.submitTechnicianFeedback.mockRejectedValue(new Error('Network error'))

    render(<TechnicianFeedbackForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

    const starButtons = screen.getAllByLabelText(/yıldız/i)
    fireEvent.click(starButtons[4])

    const submitButton = screen.getByRole('button', { name: /geri bildirimi gönder/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/geri bildirim kaydedilemedi/i)).toBeInTheDocument()
    })
  })

  it('shows success message after successful submission', async () => {
    technicianFeedbackService.submitTechnicianFeedback.mockResolvedValue({
      id: '123',
      rating: 5,
    })

    render(<TechnicianFeedbackForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

    const starButtons = screen.getAllByLabelText(/yıldız/i)
    fireEvent.click(starButtons[4])

    const submitButton = screen.getByRole('button', { name: /geri bildirimi gönder/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/geri bildiriminiz başarıyla kaydedildi/i)).toBeInTheDocument()
    })
  })

  it('calls onSuccess callback after successful submission', async () => {
    technicianFeedbackService.submitTechnicianFeedback.mockResolvedValue({
      id: '123',
      rating: 5,
    })

    render(<TechnicianFeedbackForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

    const starButtons = screen.getAllByLabelText(/yıldız/i)
    fireEvent.click(starButtons[4])

    const submitButton = screen.getByRole('button', { name: /geri bildirimi gönder/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled()
    }, { timeout: 2000 })
  })

  it('calls onCancel when cancel button is clicked', () => {
    render(<TechnicianFeedbackForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

    const cancelButton = screen.getByRole('button', { name: /vazgeç/i })
    fireEvent.click(cancelButton)

    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('disables buttons during submission', async () => {
    technicianFeedbackService.submitTechnicianFeedback.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ id: '123' }), 100))
    )

    render(<TechnicianFeedbackForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

    const starButtons = screen.getAllByLabelText(/yıldız/i)
    fireEvent.click(starButtons[4])

    const submitButton = screen.getByRole('button', { name: /geri bildirimi gönder/i })
    const cancelButton = screen.getByRole('button', { name: /vazgeç/i })

    fireEvent.click(submitButton)

    expect(submitButton).toBeDisabled()
    expect(cancelButton).toBeDisabled()

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled()
    })
  })

  it('allows typing in actual findings textareas', () => {
    render(<TechnicianFeedbackForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

    // Uncheck diagnosis to show actual findings
    const diagnosisCheckbox = screen.getByLabelText(/ai tanısı doğruydu/i)
    fireEvent.click(diagnosisCheckbox)

    const actualProblem = screen.getByPlaceholderText(/gerçek sorun neydi/i)
    const actualReason = screen.getByPlaceholderText(/sorunun nedeni/i)
    const actualSolution = screen.getByPlaceholderText(/gerçek çözüm neydi/i)

    fireEvent.change(actualProblem, { target: { value: 'Problem text' } })
    fireEvent.change(actualReason, { target: { value: 'Reason text' } })
    fireEvent.change(actualSolution, { target: { value: 'Solution text' } })

    expect(actualProblem.value).toBe('Problem text')
    expect(actualReason.value).toBe('Reason text')
    expect(actualSolution.value).toBe('Solution text')
  })
  
  it('allows typing in actual parts textarea when parts not sufficient', () => {
    render(<TechnicianFeedbackForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

    // Uncheck parts_sufficient to show the parts field
    const partsCheckbox = screen.getByLabelText(/önerilen parçalar yeterliydi/i)
    fireEvent.click(partsCheckbox)

    const actualParts = screen.getByPlaceholderText(/gerçekte gerekli olan parçalar/i)
    fireEvent.change(actualParts, { target: { value: 'Parts text' } })

    expect(actualParts.value).toBe('Parts text')
  })

  it('toggles second trip required checkbox', () => {
    render(<TechnicianFeedbackForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

    // Use the checkbox id directly as getByLabelText has issues with Turkish İ character
    const secondTripCheckbox = document.getElementById('second_trip_required')
    expect(secondTripCheckbox.checked).toBe(false)

    fireEvent.click(secondTripCheckbox)
    expect(secondTripCheckbox.checked).toBe(true)

    fireEvent.click(secondTripCheckbox)
    expect(secondTripCheckbox.checked).toBe(false)
  })

  it('toggles field trip required checkbox in actual findings', () => {
    render(<TechnicianFeedbackForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

    // Uncheck diagnosis to show actual findings
    const diagnosisCheckbox = screen.getByLabelText(/ai tanısı doğruydu/i)
    fireEvent.click(diagnosisCheckbox)

    const fieldTripCheckbox = screen.getByLabelText(/saha ziyareti gerekliydi/i)
    expect(fieldTripCheckbox.checked).toBe(false)

    fireEvent.click(fieldTripCheckbox)
    expect(fieldTripCheckbox.checked).toBe(true)

    fireEvent.click(fieldTripCheckbox)
    expect(fieldTripCheckbox.checked).toBe(false)
  })

  it('clears error message when user interacts with form', async () => {
    render(<TechnicianFeedbackForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

    // Trigger validation error
    const submitButton = screen.getByRole('button', { name: /geri bildirimi gönder/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/lütfen 1-5 arasında bir puan seçin/i)).toBeInTheDocument()
    })

    // Select rating should clear error
    const starButtons = screen.getAllByLabelText(/yıldız/i)
    fireEvent.click(starButtons[4])

    await waitFor(() => {
      expect(screen.queryByText(/lütfen 1-5 arasında bir puan seçin/i)).not.toBeInTheDocument()
    })
  })
})


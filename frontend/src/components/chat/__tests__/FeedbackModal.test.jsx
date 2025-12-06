import React, { useState } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FeedbackModal from '../FeedbackModal'

describe('FeedbackModal', () => {
  it('allows selecting rating and submitting comment', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    function Wrapper() {
      const [rating, setRating] = useState(0)
      const [comment, setComment] = useState('')
      return (
        <FeedbackModal
          open
          sessionTitle="Test Chat"
          rating={rating}
          comment={comment}
          onRatingChange={setRating}
          onCommentChange={setComment}
          onSubmit={() => onSubmit({ rating, comment })}
        />
      )
    }

    render(<Wrapper />)

    await user.click(screen.getByLabelText('4 yıldız'))
    await user.type(screen.getByPlaceholderText(/deneyiminiz/i), 'Harika destek')
    await user.click(screen.getByRole('button', { name: /gönder/i }))

    expect(onSubmit).toHaveBeenCalledWith({ rating: 4, comment: 'Harika destek' })
  })

  it('renders error message when provided', () => {
    render(
      <FeedbackModal
        open
        sessionTitle="Chat"
        rating={0}
        comment=""
        onRatingChange={() => {}}
        onCommentChange={() => {}}
        onSubmit={() => {}}
        error="Bir hata oluştu"
      />
    )

    expect(screen.getByText(/bir hata oluştu/i)).toBeInTheDocument()
  })
})


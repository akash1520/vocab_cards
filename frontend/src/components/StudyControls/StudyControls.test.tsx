import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { StudyControls } from './StudyControls'

describe('StudyControls', () => {
  it('disables review buttons until the card is flipped', () => {
    render(
      <StudyControls
        isFlipped={false}
        currentIndex={3}
        total={12}
        onKnow={vi.fn()}
        onLearning={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /still learning/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /i know this word/i })).toBeDisabled()
  })

  it('enables review buttons when the card is flipped', () => {
    render(
      <StudyControls
        isFlipped={true}
        currentIndex={3}
        total={12}
        onKnow={vi.fn()}
        onLearning={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /still learning/i })).toBeEnabled()
    expect(screen.getByRole('button', { name: /i know this word/i })).toBeEnabled()
  })

  it('calls onKnow when I know this word is clicked', async () => {
    const user = userEvent.setup()
    const onKnow = vi.fn()

    render(
      <StudyControls
        isFlipped={true}
        currentIndex={3}
        total={12}
        onKnow={onKnow}
        onLearning={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: /i know this word/i }))

    expect(onKnow).toHaveBeenCalledOnce()
  })

  it('calls onLearning when Still learning is clicked', async () => {
    const user = userEvent.setup()
    const onLearning = vi.fn()

    render(
      <StudyControls
        isFlipped={true}
        currentIndex={3}
        total={12}
        onKnow={vi.fn()}
        onLearning={onLearning}
      />,
    )

    await user.click(screen.getByRole('button', { name: /still learning/i }))

    expect(onLearning).toHaveBeenCalledOnce()
  })

  it('shows study progress as current index of total', () => {
    render(
      <StudyControls
        isFlipped={false}
        currentIndex={3}
        total={12}
        onKnow={vi.fn()}
        onLearning={vi.fn()}
      />,
    )

    expect(screen.getByText('3 / 12')).toBeVisible()
  })
})

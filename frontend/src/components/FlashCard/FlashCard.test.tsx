import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { FlashCard } from './FlashCard'
import { sampleWord } from '../../test/fixtures'

describe('FlashCard', () => {
  it('renders the term on the front and hides back content', () => {
    render(<FlashCard word={sampleWord} />)

    expect(screen.getByRole('button', { name: /unnerve/i })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(screen.getByText('unnerve')).toBeVisible()
    expect(
      screen.queryByText(/to make nervous or upset/i),
    ).not.toBeInTheDocument()
  })

  it('shows definition details on the back after click', async () => {
    const user = userEvent.setup()

    render(<FlashCard word={sampleWord} />)

    await user.click(screen.getByRole('button', { name: /unnerve/i }))

    expect(screen.getByRole('button', { name: /unnerve/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByText(/verb:/i)).toBeVisible()
    expect(screen.getByText(/to make nervous or upset/i)).toBeVisible()
    expect(screen.getByText(/enervate, faze, unsettle/i)).toBeVisible()
    expect(
      screen.getByText(/At one time unnerved by math problems/i),
    ).toBeVisible()
  })

  it('flips back to the front when clicked again', async () => {
    const user = userEvent.setup()

    render(<FlashCard word={sampleWord} />)

    const card = screen.getByRole('button', { name: /unnerve/i })
    await user.click(card)
    await user.click(card)

    expect(card).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('unnerve')).toBeVisible()
    expect(
      screen.queryByText(/to make nervous or upset/i),
    ).not.toBeInTheDocument()
  })

  it('toggles flip state with Enter and Space', async () => {
    const user = userEvent.setup()

    render(<FlashCard word={sampleWord} />)

    const card = screen.getByRole('button', { name: /unnerve/i })
    card.focus()

    await user.keyboard('{Enter}')
    expect(card).toHaveAttribute('aria-pressed', 'true')

    await user.keyboard(' ')
    expect(card).toHaveAttribute('aria-pressed', 'false')
  })
})

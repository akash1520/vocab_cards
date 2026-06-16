import { screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App'
import { renderWithRouter } from './test/renderWithRouter'

describe('App smoke test', () => {
  it('renders the vocab cards app shell', () => {
    renderWithRouter(<App />)
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })
})

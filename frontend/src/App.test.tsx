import { screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App'
import { renderWithRouter } from './test/renderWithRouter'

describe('App smoke test', () => {
  it('renders the vocab cards app shell with routed layout', () => {
    renderWithRouter(<App />)

    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^study$/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /add words/i })).toBeInTheDocument()
  })
})

import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Layout } from './Layout'
import { renderWithRouter } from '../test/renderWithRouter'

describe('Layout', () => {
  it('renders study and add words navigation links', () => {
    renderWithRouter(
      <Layout>
        <p>Page content</p>
      </Layout>,
      { route: '/' },
    )

    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeVisible()
    expect(screen.getByRole('link', { name: /^study$/i })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: /add words/i })).toHaveAttribute(
      'href',
      '/add-words',
    )
    expect(screen.getByText('Page content')).toBeVisible()
  })

  it('highlights the active study route', () => {
    renderWithRouter(
      <Layout>
        <p>Study page</p>
      </Layout>,
      { route: '/' },
    )

    expect(screen.getByRole('link', { name: /^study$/i })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('link', { name: /add words/i })).not.toHaveAttribute(
      'aria-current',
    )
  })

  it('highlights the active add words route', () => {
    renderWithRouter(
      <Layout>
        <p>Add words page</p>
      </Layout>,
      { route: '/add-words' },
    )

    expect(screen.getByRole('link', { name: /add words/i })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('link', { name: /^study$/i })).not.toHaveAttribute(
      'aria-current',
    )
  })
})

import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import {
  MemoryRouter,
  type MemoryRouterProps,
} from 'react-router-dom'
import { AuthProvider } from '../auth/AuthProvider'
import { setToken } from '../auth/tokenStorage'

type RenderWithRouterOptions = Omit<RenderOptions, 'wrapper'> & {
  route?: string
  routerProps?: Omit<MemoryRouterProps, 'initialEntries'>
  authToken?: string | null
}

export function renderWithRouter(
  ui: ReactElement,
  {
    route = '/',
    routerProps,
    authToken,
    ...renderOptions
  }: RenderWithRouterOptions = {},
) {
  if (authToken) {
    setToken(authToken)
  }

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={[route]} {...routerProps}>
        <AuthProvider>{children}</AuthProvider>
      </MemoryRouter>
    )
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

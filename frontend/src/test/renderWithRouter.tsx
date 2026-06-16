import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import {
  MemoryRouter,
  type MemoryRouterProps,
} from 'react-router-dom'

type RenderWithRouterOptions = Omit<RenderOptions, 'wrapper'> & {
  route?: string
  routerProps?: Omit<MemoryRouterProps, 'initialEntries'>
}

export function renderWithRouter(
  ui: ReactElement,
  { route = '/', routerProps, ...renderOptions }: RenderWithRouterOptions = {},
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={[route]} {...routerProps}>
        {children}
      </MemoryRouter>
    )
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

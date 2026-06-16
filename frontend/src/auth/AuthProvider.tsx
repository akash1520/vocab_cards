import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getMe, login as loginRequest, register as registerRequest } from '../api/authApi'
import type { RegisterInput, User } from '../api/authTypes'
import {
  clearToken,
  getToken,
  setToken,
  setUnauthorizedHandler,
} from './tokenStorage'

type AuthContextValue = {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const logout = useCallback(() => {
    clearToken()
    setUser(null)
  }, [])

  const bootstrap = useCallback(async () => {
    const token = getToken()
    if (!token) {
      setUser(null)
      setIsLoading(false)
      return
    }

    try {
      const currentUser = await getMe()
      setUser(currentUser)
    } catch {
      clearToken()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null)
    })

    void bootstrap()

    return () => {
      setUnauthorizedHandler(null)
    }
  }, [bootstrap])

  const login = useCallback(async (email: string, password: string) => {
    const tokenResponse = await loginRequest(email, password)
    setToken(tokenResponse.access_token)
    const currentUser = await getMe()
    setUser(currentUser)
  }, [])

  const register = useCallback(async (input: RegisterInput) => {
    await registerRequest(input)
    await login(input.email, input.password)
  }, [login])

  const value = useMemo(
    () => ({
      user,
      isLoading,
      login,
      register,
      logout,
    }),
    [user, isLoading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

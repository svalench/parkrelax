import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

interface User {
  id: number
  name: string | null
  email: string | null
  role: string
  avatar: string | null
}

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  requestPassword: (email: string) => Promise<boolean>
  refetch: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setUser(data)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const login = async (email: string, password: string): Promise<boolean> => {
    const res = await fetch('/api/auth/email/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    })
    if (res.ok) {
      await fetchUser()
      return true
    }
    return false
  }

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    setUser(null)
  }

  const requestPassword = async (email: string): Promise<boolean> => {
    const res = await fetch('/api/auth/email/request-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    return res.ok
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, requestPassword, refetch: fetchUser }}>
      {children}
    </AuthContext.Provider>
  )
}


import { createContext, useContext, useState } from 'react'
import { loginUser } from '../features/auth/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('nestly_user')

    try {
      return storedUser ? JSON.parse(storedUser) : null
    } catch {
      return null
    }
  })

  const [token, setToken] = useState(
    () => localStorage.getItem('nestly_token')
  )

  const login = async (credentials) => {
    const data = await loginUser(credentials)

    localStorage.setItem('nestly_token', data.token)
    localStorage.setItem('nestly_user', JSON.stringify(data.user))

    setToken(data.token)
    setUser(data.user)

    return data
  }

  const logout = () => {
    localStorage.removeItem('nestly_token')
    localStorage.removeItem('nestly_user')

    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token),
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

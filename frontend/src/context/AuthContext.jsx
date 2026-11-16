
import { createContext, useContext, useState } from 'react'
import { loginUser } from '../features/auth/authService.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(
    () => localStorage.getItem('nestly_token')
  )

  const login = async (credentials) => {
    const data = await loginUser(credentials)

    localStorage.setItem('nestly_token', data.token)

    setToken(data.token)
    setUser(data.user)

    return data
  }

  const logout = () => {
    localStorage.removeItem('nestly_token')
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

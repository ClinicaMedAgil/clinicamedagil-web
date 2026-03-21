import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { authService } from '../services/authService'
import type { UserRole } from '../types/user'
import { AuthContext } from './auth-context'
import type { AuthContextValue } from './auth-context'

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(authService.isAuthenticated())
  const [roles, setRoles] = useState<UserRole[]>(authService.getRoles())

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      roles,
      login: async (credentials) => {
        await authService.login(credentials)
        setIsAuthenticated(true)
        setRoles(authService.getRoles())
      },
      logout: () => {
        authService.logout()
        setIsAuthenticated(false)
        setRoles([])
      },
      hasAnyRole: (requiredRoles) => {
        if (requiredRoles.length === 0) {
          return true
        }

        return requiredRoles.some((role) => roles.includes(role))
      },
    }),
    [isAuthenticated, roles]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

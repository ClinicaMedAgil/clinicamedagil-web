import { createContext } from 'react'
import type { LoginRequest, UserRole } from '../types/user'

export interface AuthContextValue {
  isAuthenticated: boolean
  roles: UserRole[]
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => void
  hasAnyRole: (requiredRoles: UserRole[]) => boolean
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

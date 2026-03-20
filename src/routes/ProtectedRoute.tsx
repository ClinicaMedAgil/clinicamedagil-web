import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import type { UserRole } from '../types/user'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRoles?: UserRole[]
}

const ProtectedRoute = ({ children, requiredRoles = [] }: ProtectedRouteProps) => {
  const { isAuthenticated, hasAnyRole } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!hasAnyRole(requiredRoles)) {
    return <Navigate to="/sem-permissao" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute

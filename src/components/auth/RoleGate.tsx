import type { ReactNode } from 'react'
import { useAuth } from '../../hooks/useAuth'
import type { UserRole } from '../../types/user'

interface RoleGateProps {
  roles: UserRole[]
  children: ReactNode
}

const RoleGate = ({ roles, children }: RoleGateProps) => {
  const { hasAnyRole } = useAuth()

  if (!hasAnyRole(roles)) {
    return null
  }

  return <>{children}</>
}

export default RoleGate

import { api, authStorage } from './api'
import type {
  ChangePasswordPayload,
  LoginRequest,
  LoginResponse,
  SessionUser,
  UserRole,
} from '../types/user'

const normalizeRole = (value: unknown): UserRole | null => {
  const text = String(value).trim().toUpperCase()

  if (!text) {
    return null
  }

  const cleaned = text
    .replace(/^ROLE_/, '')
    .replace(/^PERFIL_/, '')
    .replace(/^TIPO_/, '')
    .replace(/\s+/g, '_')

  if (cleaned === 'ADMIN' || cleaned.includes('ADMIN')) {
    return 'ADMIN'
  }

  if (cleaned === 'ATENDENTE' || cleaned.includes('ATENDENTE')) {
    return 'ATENDENTE'
  }

  if (cleaned === 'MEDICO' || cleaned.includes('MEDIC')) {
    return 'MEDICO'
  }

  if (
    cleaned === 'PACIENTE' ||
    cleaned.includes('PACIENTE') ||
    cleaned === 'USUARIO' ||
    cleaned.includes('USER') ||
    cleaned.includes('USUARIO')
  ) {
    return 'PACIENTE'
  }

  return null
}

const parseJwtPayload = (token: string): Record<string, unknown> | null => {
  try {
    const [, payload] = token.split('.')

    if (!payload) {
      return null
    }

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
    const decodedPayload = window.atob(padded)
    return JSON.parse(decodedPayload) as Record<string, unknown>
  } catch {
    return null
  }
}

const extractRoles = (payload: Record<string, unknown> | null): UserRole[] => {
  if (!payload) {
    return []
  }

  const toRoleCandidates = (value: unknown): unknown[] => {
    if (Array.isArray(value)) {
      return value
    }

    if (typeof value === 'string') {
      return value.split(/[,\s]+/).filter(Boolean)
    }

    if (value && typeof value === 'object') {
      const roleObject = value as Record<string, unknown>
      return [
        roleObject.authority,
        roleObject.role,
        roleObject.roles,
        roleObject.nome,
        roleObject.name,
        roleObject.tipo,
        roleObject.tipoUsuario,
        roleObject.descricao,
      ].filter(Boolean)
    }

    return []
  }

  const resourceAccessRoles = (() => {
    const resourceAccess = payload.resource_access

    if (!resourceAccess || typeof resourceAccess !== 'object') {
      return []
    }

    return Object.values(resourceAccess as Record<string, unknown>).flatMap((entry) =>
      toRoleCandidates(entry).flatMap((candidate) => toRoleCandidates(candidate))
    )
  })()

  const roleCandidates = [
    payload.roles,
    payload.authorities,
    payload.perfis,
    payload.role,
    payload.tipoUsuario,
    payload.tipo,
    payload.perfil,
    payload.userRole,
    payload.nivelAcesso,
    payload.scope,
    payload.scopes,
    payload.grupos,
    (payload.realm_access as Record<string, unknown> | undefined)?.roles,
    resourceAccessRoles,
  ].flatMap((value) => {
    return toRoleCandidates(value).flatMap((candidate) => toRoleCandidates(candidate))
  })

  return Array.from(new Set(roleCandidates.map(normalizeRole).filter((item): item is UserRole => item !== null)))
}

export const authService = {
  async login(payload: LoginRequest): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', payload)
    authStorage.setAuth(data.token, data.tipo, data.usuario)
    return data
  },

  logout(): void {
    authStorage.clearAuth()
  },

  isAuthenticated(): boolean {
    return Boolean(authStorage.getToken())
  },

  getToken(): string | null {
    return authStorage.getToken()
  },

  getRoles(): UserRole[] {
    const token = authStorage.getToken()
    const payload = token ? parseJwtPayload(token) : null
    const tokenRoles = extractRoles(payload)

    if (tokenRoles.length > 0) {
      return tokenRoles
    }

    try {
      const raw = authStorage.getSessionUserRaw()
      if (!raw) {
        return []
      }
      const user = JSON.parse(raw) as Record<string, unknown>
      const role = normalizeRole(user.role)
      return role ? [role] : []
    } catch {
      return []
    }
  },

  getSessionUser(): SessionUser | null {
    const token = authStorage.getToken()
    const payload = token ? parseJwtPayload(token) : null
    let storedUser: Record<string, unknown> | null = null

    try {
      const raw = authStorage.getSessionUserRaw()
      storedUser = raw ? (JSON.parse(raw) as Record<string, unknown>) : null
    } catch {
      storedUser = null
    }

    if (!payload && !storedUser) {
      return null
    }

    return {
      id:
        (storedUser?.id as number | string | undefined) ??
        (payload?.userId as number | string | undefined) ??
        (payload?.id as number | string | undefined),
      nome:
        (storedUser?.nome as string | undefined) ??
        (payload?.nome as string | undefined) ??
        (payload?.name as string | undefined) ??
        (payload?.preferred_username as string | undefined),
      email:
        (storedUser?.email as string | undefined) ??
        (payload?.email as string | undefined) ??
        (payload?.sub as string | undefined),
      cpf:
        (storedUser?.cpf as string | undefined) ??
        (payload?.cpf as string | undefined) ??
        (payload?.documento as string | undefined),
      role:
        (storedUser?.role as string | undefined) ??
        (payload?.role as string | undefined),
      telefone:
        (payload?.telefone as string | undefined) ??
        (payload?.phone as string | undefined) ??
        (payload?.celular as string | undefined),
      status: (payload?.status as string | undefined) ?? (payload?.situacao as string | undefined),
      tipoUsuarioId:
        (payload?.tipoUsuarioId as number | undefined) ?? (payload?.tipo_usuario_id as number | undefined),
      tipoUsuarioNome:
        (payload?.tipoUsuarioNome as string | undefined) ??
        (payload?.nomeTipoUsuario as string | undefined) ??
        (payload?.tipoUsuario as string | undefined),
    }
  },

  async changeMyPassword(payload: ChangePasswordPayload): Promise<void> {
    const endpoints = ['/auth/change-password', '/usuarios/alterar-senha']

    let lastError: unknown = null

    for (const endpoint of endpoints) {
      try {
        await api.put(endpoint, payload)
        return
      } catch (error) {
        lastError = error
      }
    }

    throw lastError
  },
}

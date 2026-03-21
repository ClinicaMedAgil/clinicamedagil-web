import { api, authStorage } from './api'
import type {
  ChangePasswordPayload,
  LoginRequest,
  LoginResponse,
  SessionUser,
  UserRole,
} from '../types/user'

const USER_ROLE_SET: ReadonlySet<UserRole> = new Set(['ADMIN', 'ATENDENTE', 'MEDICO', 'PACIENTE'])

const normalizeRole = (value: unknown): UserRole | null => {
  const text = String(value)
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()

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

  /** Alguns JWTs usam inglês ou sinônimos; não confundir com substring "USER" em "MEDICO". */
  if (
    cleaned === 'MEDICO' ||
    cleaned.includes('MEDIC') ||
    cleaned === 'DOCTOR' ||
    cleaned.includes('DOCTOR') ||
    cleaned === 'PHYSICIAN' ||
    cleaned.includes('PHYSICIAN')
  ) {
    return 'MEDICO'
  }

  if (
    cleaned === 'PACIENTE' ||
    cleaned.includes('PACIENTE') ||
    cleaned === 'USUARIO' ||
    cleaned.includes('USUARIO') ||
    (cleaned.includes('USER') && !cleaned.includes('MEDIC'))
  ) {
    return 'PACIENTE'
  }

  return null
}

const toRoleFromTokenString = (value: unknown): UserRole | null => {
  const normalized = normalizeRole(value)
  return normalized && USER_ROLE_SET.has(normalized) ? normalized : null
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

/** Quando o JWT mistura claims (ex.: tipo no cadastro + authorities), um único papel “ganha” na UI. */
const ROLE_PRIORITY: Record<UserRole, number> = {
  ADMIN: 0,
  ATENDENTE: 1,
  MEDICO: 2,
  PACIENTE: 3,
}

const sortRolesByPriority = (roles: UserRole[]): UserRole[] =>
  [...roles].sort((a, b) => ROLE_PRIORITY[a] - ROLE_PRIORITY[b])

const toFlatTokens = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.flatMap((item) => toFlatTokens(item))
  }

  if (typeof value === 'string') {
    return value
      .split(/[,\s]+/)
      .map((item) => item.trim())
      .filter(Boolean)
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return [
      ...toFlatTokens(record.authority),
      ...toFlatTokens(record.authorities),
      ...toFlatTokens(record.role),
      ...toFlatTokens(record.roles),
    ]
  }

  return []
}

const extractRoles = (payload: Record<string, unknown> | null): UserRole[] => {
  if (!payload) {
    return []
  }

  const roleCandidates: string[] = [
    payload.roles,
    payload.authorities,
    payload.role,
    (payload.realm_access as Record<string, unknown> | undefined)?.roles,
  ].flatMap((value) => toFlatTokens(value))

  const resourceAccess = payload.resource_access
  if (resourceAccess && typeof resourceAccess === 'object') {
    Object.values(resourceAccess as Record<string, unknown>).forEach((clientEntry) => {
      if (!clientEntry || typeof clientEntry !== 'object') {
        return
      }
      const entry = clientEntry as Record<string, unknown>
      roleCandidates.push(...toFlatTokens(entry.roles))
      roleCandidates.push(...toFlatTokens(entry.authorities))
      roleCandidates.push(...toFlatTokens(entry.role))
    })
  }

  return sortRolesByPriority(
    Array.from(
      new Set(roleCandidates.map(toRoleFromTokenString).filter((item): item is UserRole => item !== null))
    )
  )
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
    return extractRoles(payload)
  },

  /** Rótulo curto em português para o papel usado na UI (header, perfil). */
  getPrimaryRoleLabel(): string | null {
    const [first] = this.getRoles()
    if (!first) {
      return null
    }
    const labels: Record<UserRole, string> = {
      ADMIN: 'Administrador',
      ATENDENTE: 'Atendente',
      MEDICO: 'Médico',
      PACIENTE: 'Paciente',
    }
    return labels[first] ?? first
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

    const [primaryRole] = this.getRoles()

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
      role: primaryRole ?? (storedUser?.role as string | undefined) ?? (payload?.role as string | undefined),
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

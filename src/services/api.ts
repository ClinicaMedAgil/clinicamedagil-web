import axios from 'axios'
import { message } from 'antd'

/** Corpo Spring Boot (error default), RFC 7807, Bean Validation, etc. */
const pickErrorDetail = (data: unknown): string | undefined => {
  if (data == null) {
    return undefined
  }
  if (typeof data === 'string' && data.trim()) {
    return data.trim()
  }
  if (typeof data !== 'object') {
    return undefined
  }
  const o = data as Record<string, unknown>

  if (typeof o.message === 'string' && o.message.trim()) {
    return o.message.trim()
  }

  if (typeof o.mensagem === 'string' && o.mensagem.trim()) {
    return o.mensagem.trim()
  }

  if (typeof o.detail === 'string' && o.detail.trim()) {
    return o.detail.trim()
  }

  if (typeof o.title === 'string' && o.title.trim()) {
    const d = typeof o.detail === 'string' ? o.detail : ''
    return d ? `${o.title.trim()}: ${d}` : o.title.trim()
  }

  const errs = o.errors ?? o.erros
  if (Array.isArray(errs) && errs.length > 0) {
    const first = errs[0]
    if (typeof first === 'string') {
      return first
    }
    if (first && typeof first === 'object') {
      const e = first as Record<string, unknown>
      const dm = e.defaultMessage ?? e.message ?? e.mensagem
      if (typeof dm === 'string' && dm.trim()) {
        return dm.trim()
      }
    }
  }

  /** Spring default error JSON costuma vir só com error + path + status (sem message). */
  if (typeof o.error === 'string' && o.error.trim()) {
    const parts = [o.error.trim()]
    if (typeof o.path === 'string' && o.path.trim()) {
      parts.push(o.path.trim())
    }
    return parts.join(' — ')
  }

  return undefined
}

const TOKEN_STORAGE_KEY = 'auth_token'
const AUTH_TYPE_STORAGE_KEY = 'auth_tipo'
const SESSION_USER_STORAGE_KEY = 'auth_usuario'
/** `||` evita base vazia quando VITE_FRONTEND_API_URL="" (quebraria DELETE/GET para `/consultas/...`). */
export const API_BASE_URL =
  (import.meta.env.VITE_FRONTEND_API_URL as string | undefined) || '/clinicamedagil-service'

const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS) || 120_000

export const authStorage = {
  getToken: (): string | null => localStorage.getItem(TOKEN_STORAGE_KEY),
  getAuthType: (): string => localStorage.getItem(AUTH_TYPE_STORAGE_KEY) ?? 'Bearer',
  getSessionUserRaw: (): string | null => localStorage.getItem(SESSION_USER_STORAGE_KEY),
  setAuth: (token: string, tipo = 'Bearer', user?: unknown): void => {
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
    localStorage.setItem(AUTH_TYPE_STORAGE_KEY, tipo)
    if (user) {
      localStorage.setItem(SESSION_USER_STORAGE_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(SESSION_USER_STORAGE_KEY)
    }
  },
  clearAuth: (): void => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    localStorage.removeItem(AUTH_TYPE_STORAGE_KEY)
    localStorage.removeItem(SESSION_USER_STORAGE_KEY)
  },
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
})

api.interceptors.request.use((config) => {
  const token = authStorage.getToken()

  if (token) {
    config.headers.Authorization = `${authStorage.getAuthType()} ${token}`
  }

  /**
   * DELETE sem corpo com Content-Type: application/json faz o Spring tentar ler JSON
   * e responder 400. Removemos o header nesse caso.
   */
  const method = String(config.method ?? 'get').toLowerCase()
  if (method === 'delete' && config.data == null) {
    const h = config.headers as { delete?: (name: string) => void } & Record<string, unknown>
    if (typeof h.delete === 'function') {
      h.delete('Content-Type')
    } else {
      delete h['Content-Type']
    }
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status as number | undefined
    const requestUrl = String(error?.config?.url ?? '')
    const isLoginRequest = requestUrl.includes('/auth/login')
    const isTimeout =
      error?.code === 'ECONNABORTED' ||
      (typeof error?.message === 'string' && error.message.toLowerCase().includes('timeout'))

    if (isTimeout && !error?.response) {
      message.error(
        'O servidor demorou para responder. Verifique se a API está no ar ou tente novamente em instantes.'
      )
    }

    if (status === 401 && !isLoginRequest) {
      authStorage.clearAuth()
      message.error('Sua sessão expirou. Faça login novamente.')

      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    if (status === 403 && !isLoginRequest) {
      message.error('Você não possui permissão para executar esta ação.')
    }

    if (status === 400 && !isLoginRequest) {
      if (import.meta.env.DEV) {
        console.warn('[API 400]', requestUrl, error?.response?.data)
      }
      const detail = pickErrorDetail(error?.response?.data)
      message.error(detail ?? 'Requisição inválida. Verifique os dados e tente novamente.')
    }

    /**
     * 409 Conflict — ex.: RegistroDuplicadoException ao marcar consulta (mesma especialidade
     * já agendada ou mesmo dia/horário que outra consulta não finalizada).
     */
    if (status === 409 && !isLoginRequest) {
      const detail = pickErrorDetail(error?.response?.data)
      message.warning(
        detail ??
          'Já existe uma consulta marcada com essa especialidade ou para essa data e horário.'
      )
    }

    if (status === 404) {
      message.error('Recurso não encontrado.')
    }

    if (status && status >= 500) {
      message.error('Erro interno do servidor. Tente novamente em instantes.')
    }

    return Promise.reject(error)
  }
)

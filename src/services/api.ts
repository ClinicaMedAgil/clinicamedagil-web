import axios from 'axios'
import { message } from 'antd'

const TOKEN_STORAGE_KEY = 'auth_token'
const AUTH_TYPE_STORAGE_KEY = 'auth_tipo'
const SESSION_USER_STORAGE_KEY = 'auth_usuario'
export const API_BASE_URL =
  import.meta.env.VITE_FRONTEND_API_URL ?? '/clinicamedagil-service'

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

    if (status === 404) {
      message.error('Recurso não encontrado.')
    }

    if (status && status >= 500) {
      message.error('Erro interno do servidor. Tente novamente em instantes.')
    }

    return Promise.reject(error)
  }
)

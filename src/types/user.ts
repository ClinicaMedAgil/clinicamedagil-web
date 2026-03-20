export type UserRole = 'ADMIN' | 'ATENDENTE' | 'MEDICO' | 'PACIENTE'

export interface LoginRequest {
  email: string
  senha: string
}

export interface LoginResponse {
  token: string
  tipo: string
  usuario?: {
    id?: number | string
    nome?: string
    cpf?: string
    email?: string
    role?: string
    [key: string]: unknown
  }
}

export interface ChangePasswordPayload {
  senhaAtual: string
  novaSenha: string
}

export interface SessionUser {
  id?: number | string
  nome?: string
  email?: string
  cpf?: string
  role?: string
  telefone?: string
  status?: string
  tipoUsuarioId?: number
  tipoUsuarioNome?: string
}

export interface UsuarioDTO {
  id?: number
  nome: string
  cpf: string
  email: string
  senha?: string
  telefone?: string
  status?: string
  tipoUsuarioId: number
  especialidadeId?: number
  especialidadeIds?: number[]
  tipoUsuarioNome?: string
  tipoUsuario?: string
  perfilId?: number
  nivelAcessoId?: number
}

export interface TipoUsuarioDTO {
  id: number
  nome: string
}

export interface PublicRegisterPayload {
  nome: string
  cpf: string
  email: string
  telefone?: string
}

export type UsuarioUpsertPayload = Omit<UsuarioDTO, 'id'>

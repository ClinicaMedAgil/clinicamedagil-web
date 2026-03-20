import { api } from './api'
import { createCrudService } from './crudFactory'
import type { PublicRegisterPayload, UsuarioDTO, UsuarioUpsertPayload } from '../types/user'

const crud = createCrudService<UsuarioDTO, UsuarioUpsertPayload>('/usuarios')

export const userService = {
  ...crud,
  async getMe(): Promise<UsuarioDTO> {
    const { data } = await api.get<UsuarioDTO>('/usuarios/me')
    return data
  },
  async updateMe(payload: Partial<UsuarioUpsertPayload>): Promise<UsuarioDTO> {
    const { data } = await api.put<UsuarioDTO>('/usuarios/me', payload)
    return data
  },
  async createPublicUser(payload: PublicRegisterPayload): Promise<void> {
    await api.post('/usuarios/criarUsuarioComum', payload)
  },
}

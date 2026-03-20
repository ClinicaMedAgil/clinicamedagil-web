import { api } from './api'
import type { MedicoEspecialidadeDTO } from '../types/resources'

export const medicoEspecialidadeService = {
  async list(): Promise<MedicoEspecialidadeDTO[]> {
    const { data } = await api.get<MedicoEspecialidadeDTO[]>('/medicoespecialidade')
    return data
  },
  async getByCompositeId(
    medicoId: number,
    especialidadeId: number
  ): Promise<MedicoEspecialidadeDTO> {
    const { data } = await api.get<MedicoEspecialidadeDTO>(
      `/medicoespecialidade/${medicoId}/${especialidadeId}`
    )
    return data
  },
  async create(payload: MedicoEspecialidadeDTO): Promise<MedicoEspecialidadeDTO> {
    try {
      const { data } = await api.post<MedicoEspecialidadeDTO>('/medicoespecialidade', {
        medico: { id: payload.medicoId },
        especialidade: { id: payload.especialidadeId },
      })
      return data
    } catch {
      const { data } = await api.post<MedicoEspecialidadeDTO>('/medicoespecialidade', payload)
      return data
    }
  },
  async remove(medicoId: number, especialidadeId: number): Promise<void> {
    await api.delete(`/medicoespecialidade/${medicoId}/${especialidadeId}`)
  },
}

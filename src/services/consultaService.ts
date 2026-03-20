import { api } from './api'
import { createCrudService } from './crudFactory'
import type { ConsultaCreatePayload, ConsultaDTO } from '../types/resources'

const crud = createCrudService<ConsultaDTO>('/consultas')

export const consultaService = {
  ...crud,
  async createConsulta(payload: ConsultaCreatePayload): Promise<ConsultaDTO> {
    const { data } = await api.post<ConsultaDTO>('/consultas', payload)
    return data
  },
  async listPaciente(): Promise<ConsultaDTO[]> {
    const { data } = await api.get<ConsultaDTO[]>('/consultas/paciente')
    return data
  },
  async listMedico(): Promise<ConsultaDTO[]> {
    const { data } = await api.get<ConsultaDTO[]>('/consultas/medico')
    return data
  },
}

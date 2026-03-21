import { createCrudService } from './crudFactory'
import { api } from './api'
import type { AgendamentoCreateFromHorarioPayload, AgendamentoDTO } from '../types/resources'

const crud = createCrudService<AgendamentoDTO>('/agendamentos')

export const agendamentoService = {
  ...crud,
  async createFromHorario(payload: AgendamentoCreateFromHorarioPayload): Promise<AgendamentoDTO> {
    const { data } = await api.post<AgendamentoDTO>('/agendamentos', payload)
    return data
  },
}

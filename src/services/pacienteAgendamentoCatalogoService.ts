import { api } from './api'
import type {
  AgendaHorariosDisponiveisDTO,
  EspecialidadeDTO,
  MedicoEspecialidadeDTO,
} from '../types/resources'

const BASE = '/paciente/agendamento-catalogo'

export const pacienteAgendamentoCatalogoService = {
  async listEspecialidades(): Promise<EspecialidadeDTO[]> {
    const { data } = await api.get<EspecialidadeDTO[]>(`${BASE}/especialidades`)
    return data
  },

  async getEspecialidade(id: number): Promise<EspecialidadeDTO> {
    const { data } = await api.get<EspecialidadeDTO>(`${BASE}/especialidades/${id}`)
    return data
  },

  async listMedicos(especialidadeId: number): Promise<MedicoEspecialidadeDTO[]> {
    const { data } = await api.get<MedicoEspecialidadeDTO[]>(
      `${BASE}/especialidades/${especialidadeId}/medicos`
    )
    return data
  },

  async listMedicosPorNomeEspecialidade(nome: string): Promise<MedicoEspecialidadeDTO[]> {
    const { data } = await api.get<MedicoEspecialidadeDTO[]>(
      `${BASE}/medicos-por-nome-especialidade`,
      { params: { nome } }
    )
    return data
  },

  async listHorariosDisponiveisPorMedico(medicoId: number): Promise<AgendaHorariosDisponiveisDTO[]> {
    const { data } = await api.get<AgendaHorariosDisponiveisDTO[]>(
      `${BASE}/medicos/${medicoId}/horarios-disponiveis`
    )
    return data
  },

  async listHorariosDisponiveis(
    especialidadeId: number,
    medicoId: number
  ): Promise<AgendaHorariosDisponiveisDTO[]> {
    const { data } = await api.get<AgendaHorariosDisponiveisDTO[]>(
      `${BASE}/especialidades/${especialidadeId}/medicos/${medicoId}/horarios-disponiveis`
    )
    return data
  },
}

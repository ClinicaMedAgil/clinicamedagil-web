import { api } from './api'
import type { AgendaHorariosDisponiveisDTO } from '../types/resources'

/** Novo controller: PacienteAgendaController — mesmo contrato do catálogo (AgendaComHorariosDisponiveisDTO). */
const BASE = '/paciente/agendas'

export const pacienteAgendaService = {
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

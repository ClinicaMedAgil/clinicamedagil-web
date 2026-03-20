export interface ApiEntityBase {
  id?: number
  [key: string]: unknown
}

export type PerfilDTO = ApiEntityBase
export type NivelAcessoDTO = ApiEntityBase
export interface EspecialidadeDTO extends ApiEntityBase {
  nomeEspecialidade: string
  descricao?: string | null
}
export type AgendamentoDTO = ApiEntityBase
export interface ConsultaCreatePayload {
  agendamentoId: number
  medicoId: number
  pacienteId: number
  dataConsulta?: string
  queixaPrincipal?: string
  historiaDoencaAtual?: string
  diagnostico?: string
  prescricao?: string
  observacoes?: string
}

export type ConsultaDTO = ApiEntityBase
export interface AgendaMedicoDTO extends ApiEntityBase {
  medicoId: number
  especialidadeId: number
  dataAgenda: string
  statusAgenda?: string
}
export interface AgendaMedicoPayload {
  medicoId: number
  especialidadeId: number
  dataAgenda: string
  statusAgenda?: string
}
export interface HorarioAgendaDTO extends ApiEntityBase {
  agendaId: number
  horaInicio: string
  horaFim: string
  statusHorario?: string
}
export interface HorarioAgendaPayload {
  agendaId: number
  horaInicio: string
  horaFim: string
  statusHorario?: string
}

export interface MedicoEspecialidadeDTO {
  medicoId: number
  especialidadeId: number
  [key: string]: unknown
}

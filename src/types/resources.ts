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

/** POST /agendamentos — vínculo paciente + horário (fluxo paciente) */
export interface AgendamentoCreateFromHorarioPayload {
  horarioId: number
  pacienteId: number
}
export interface AgendaMedicoDTO extends ApiEntityBase {
  medicoId: number
  especialidadeId: number
  dataAgenda: string
  statusAgenda?: string
  /** Preenchido nas respostas de leitura/catálogo; ausente no POST de criação. */
  nomeMedico?: string | null
  nomeEspecialidade?: string | null
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

/**
 * GET /consultas, /paciente/consultas/minhas, etc. — pode vir plano (findWithDetalhes)
 * ou com `horario`/`agenda` aninhados em fluxos antigos.
 */
export interface ConsultaDTO extends ApiEntityBase {
  horarioId?: number
  agendaId?: number
  especialidadeId?: number
  medicoId?: number
  agendamentoId?: number
  pacienteId?: number
  dataConsulta?: string | null
  /** Data do slot na agenda (ex.: quando `dataConsulta` vem null). */
  dataAgenda?: string | null
  queixaPrincipal?: string | null
  nomeMedico?: string | null
  nomeEspecialidade?: string | null
  /** LocalTime serializado (ex.: "08:00:00") quando o DTO vem plano. */
  horaInicio?: string | null
  horaFim?: string | null
  /** Alguns fluxos usam `statusConsulta` (ex.: AGENDADA, FINALIZADA). */
  statusConsulta?: string | null
  status?: string
  historiaDoencaAtual?: string | null
  diagnostico?: string | null
  prescricao?: string | null
  observacoes?: string | null
  nomePaciente?: string | null
  horario?: HorarioAgendaDTO & { agenda?: AgendaMedicoDTO }
}
export interface HorarioAgendaPayload {
  agendaId: number
  horaInicio: string
  horaFim: string
  statusHorario?: string
}

export interface MedicoResumoDTO {
  id: number
  nome: string
}

export interface EspecialidadeResumoDTO {
  id: number
  nome: string
}

/** Vínculo médico–especialidade: API devolve resumos com id e nome (Usuario.nome / nomeEspecialidade). */
export interface MedicoEspecialidadeDTO {
  medicoId: number
  especialidadeId: number
  medico?: MedicoResumoDTO
  especialidade?: EspecialidadeResumoDTO
}

/** Bloco retornado pelo catálogo de agendamento do paciente e por PacienteAgendaController. */
export interface AgendaHorariosDisponiveisDTO {
  agenda: AgendaMedicoDTO
  horariosDisponiveis: HorarioAgendaDTO[]
}

/** Alias alinhado ao DTO da API (AgendaComHorariosDisponiveisDTO). */
export type AgendaComHorariosDisponiveisDTO = AgendaHorariosDisponiveisDTO

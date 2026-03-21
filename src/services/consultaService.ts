import { api } from './api'
import type { ConsultaDTO } from '../types/resources'

/** Corpo opcional de `PATCH /medico/consultas/{id}/finalizar` — omitidos/null não alteram o salvo. */
export interface FinalizarConsultaMedicoPayload {
  queixaPrincipal?: string | null
  historiaDoencaAtual?: string | null
  diagnostico?: string | null
  prescricao?: string | null
  observacoes?: string | null
}

export interface ConsultaSalvarPayload {
  horarioId: number
  /** Opcional: atendente marcando para outro paciente (se a API exigir). */
  pacienteId?: number
}

export const consultaService = {
  /**
   * Marca consulta (paciente/atendente). Pode responder **409 Conflict** se
   * `validarConflitoAgendaMarcacao` detectar mesma especialidade já agendada ou mesmo dia/horário
   * (consulta não finalizada) — corpo com `mensagem` (GlobalExceptionHandler / RegistroDuplicadoException).
   */
  async salvar(payload: ConsultaSalvarPayload): Promise<ConsultaDTO> {
    const { data } = await api.post<ConsultaDTO>('/consultas', payload)
    return data
  },

  /**
   * Paciente / usuário comum: só consultas do login (PacienteConsultasController).
   * A API devolve DTO com detalhes planos (nomeMedico, horaInicio, dataAgenda, etc.).
   */
  async listMinhasPaciente(): Promise<ConsultaDTO[]> {
    const { data } = await api.get<ConsultaDTO[]>('/paciente/consultas/minhas')
    return data
  },

  /** ATENDENTE/ADMIN: lista de consultas de pacientes (endpoint de gestão existente). */
  async listConsultasPacienteGestao(): Promise<ConsultaDTO[]> {
    const { data } = await api.get<ConsultaDTO[]>('/consultas/paciente')
    return data
  },

  /**
   * Cancelar consulta (paciente): `DELETE /paciente/consultas/{id}`.
   * O `id` é o campo `id` do JSON de GET `/paciente/consultas/minhas` (entidade Consulta, não horário).
   * `api` já usa `baseURL` `/clinicamedagil-service` + `Authorization: Bearer` no interceptor.
   * Sucesso: 204 No Content. Erros: 401 sem token, 403 se não for PACIENTE/USUARIO ou não for dono, 404 se id inexistente.
   */
  async removePaciente(id: number): Promise<void> {
    if (!Number.isFinite(id) || id <= 0) {
      throw new Error('id da consulta inválido')
    }
    await api.delete(`/paciente/consultas/${encodeURIComponent(String(id))}`)
  },

  /** ATENDENTE / ADMIN — mesmo fluxo de permissão via recurso geral. */
  async removeGestao(id: number): Promise<void> {
    if (!Number.isFinite(id) || id <= 0) {
      throw new Error('id da consulta inválido')
    }
    await api.delete(`/consultas/${encodeURIComponent(String(id))}`)
  },

  /**
   * MEDICO: consultas do médico logado (lista com detalhes para calendário).
   * `GET /medico/consultas`
   */
  async listMinhasMedico(): Promise<ConsultaDTO[]> {
    const { data } = await api.get<ConsultaDTO[]>('/medico/consultas')
    return data
  },

  /**
   * MEDICO: encerra a consulta com dados clínicos opcionais; resposta é ConsultaDTO completo.
   * `PATCH /medico/consultas/{id}/finalizar`
   */
  async finalizarComoMedico(
    id: number,
    payload?: FinalizarConsultaMedicoPayload
  ): Promise<ConsultaDTO> {
    if (!Number.isFinite(id) || id <= 0) {
      throw new Error('id da consulta inválido')
    }
    const { data } = await api.patch<ConsultaDTO>(
      `/medico/consultas/${encodeURIComponent(String(id))}/finalizar`,
      payload ?? {}
    )
    return data
  },
}

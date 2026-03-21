import type { AxiosError } from 'axios'
import dayjs from 'dayjs'

export interface ApiErrorBody {
  message?: string
  mensagem?: string
  error?: string
  errors?: Record<string, string[] | string>
  erros?: Array<{ campo?: string; erro?: string }>
}

export interface ParsedApiError {
  status?: number
  message: string
  fieldErrors: Record<string, string>
}

export interface ConsultaFormValues {
  agendamentoId?: number
  medicoId?: number
  pacienteId?: number
  dataConsulta?: dayjs.Dayjs | null
  queixaPrincipal?: string
  historiaDoencaAtual?: string
  diagnostico?: string
  prescricao?: string
  observacoes?: string
}

const getErrorText = (value: unknown): string | null => {
  if (typeof value === 'string' && value.trim()) {
    return value.trim()
  }
  return null
}

const normalizeText = (value: string | undefined, maxLength: number): string | undefined => {
  if (!value) {
    return undefined
  }
  return value.trim().slice(0, maxLength)
}

export const isValidPositiveNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0

export const parseConsultaApiError = (error: unknown): ParsedApiError => {
  const axiosError = error as AxiosError<ApiErrorBody>
  const status = axiosError.response?.status
  const body = axiosError.response?.data
  const fieldErrors: Record<string, string> = {}

  const bodyErrors = body?.errors
  if (bodyErrors && typeof bodyErrors === 'object') {
    Object.entries(bodyErrors).forEach(([field, rawValue]) => {
      if (Array.isArray(rawValue)) {
        const first = rawValue.find((item) => getErrorText(item))
        if (first) {
          fieldErrors[field] = String(first)
        }
        return
      }

      const text = getErrorText(rawValue)
      if (text) {
        fieldErrors[field] = text
      }
    })
  }

  const errosLista = body?.erros
  if (Array.isArray(errosLista)) {
    errosLista.forEach((item) => {
      const campo = typeof item.campo === 'string' ? item.campo.trim() : ''
      const erro = getErrorText(item.erro)
      if (campo && erro) {
        fieldErrors[campo] = fieldErrors[campo] ? `${fieldErrors[campo]} ${erro}` : erro
      }
    })
  }

  const bodyMessage =
    getErrorText(body?.mensagem) ??
    getErrorText(body?.message) ??
    getErrorText(body?.error)

  if (status === 403) {
    return { status, message: bodyMessage ?? 'Você não tem permissão.', fieldErrors }
  }
  if (status === 400) {
    return { status, message: bodyMessage ?? 'Regra de negócio inválida para criar consulta.', fieldErrors }
  }
  if (status === 422) {
    return {
      status,
      message: bodyMessage ?? 'Existem campos inválidos. Revise o formulário.',
      fieldErrors,
    }
  }
  if (status === 500) {
    return { status, message: 'Erro inesperado ao salvar consulta. Tente novamente.', fieldErrors }
  }

  return {
    status,
    message: bodyMessage ?? 'Não foi possível salvar a consulta.',
    fieldErrors,
  }
}

/** Heurística para conflito de horário (400) após POST agendamento/consulta */
export const isHorarioIndisponivelMessage = (text: string): boolean => {
  const m = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
  return (
    m.includes('nao esta disponivel') ||
    m.includes('nao disponivel') ||
    m.includes('indisponivel') ||
    (m.includes('horario') && m.includes('dispon')) ||
    m.includes('ocupado') ||
    m.includes('ja reservado')
  )
}

export const buildCreateConsultaPayload = (values: ConsultaFormValues) => {
  if (!isValidPositiveNumber(values.agendamentoId)) {
    throw new Error('Agendamento inválido.')
  }
  if (!isValidPositiveNumber(values.medicoId)) {
    throw new Error('Médico inválido.')
  }
  if (!isValidPositiveNumber(values.pacienteId)) {
    throw new Error('Paciente inválido.')
  }

  if (values.dataConsulta && !values.dataConsulta.isValid()) {
    throw new Error('Data da consulta inválida.')
  }

  return {
    agendamentoId: values.agendamentoId,
    medicoId: values.medicoId,
    pacienteId: values.pacienteId,
    dataConsulta: values.dataConsulta ? values.dataConsulta.toISOString() : undefined,
    queixaPrincipal: normalizeText(values.queixaPrincipal, 500),
    historiaDoencaAtual: normalizeText(values.historiaDoencaAtual, 2000),
    diagnostico: normalizeText(values.diagnostico, 2000),
    prescricao: normalizeText(values.prescricao, 2000),
    observacoes: normalizeText(values.observacoes, 2000),
  }
}

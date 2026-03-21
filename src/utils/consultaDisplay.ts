import dayjs from 'dayjs'
import type { ConsultaDTO } from '../types/resources'

const toNumber = (value: unknown): number | null => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const asRecord = (v: unknown): Record<string, unknown> | null =>
  v !== null && typeof v === 'object' ? (v as Record<string, unknown>) : null

const firstNonEmptyString = (...candidates: unknown[]): string | undefined => {
  for (const x of candidates) {
    if (typeof x === 'string' && x.trim()) {
      return x.trim()
    }
  }
  return undefined
}

const toYmdCalendario = (value: string): string | null => {
  const s = value.trim()
  if (s.length < 10) {
    return null
  }
  const head = s.slice(0, 10)
  if (/^\d{4}-\d{2}-\d{2}$/.test(head)) {
    return head
  }
  const d = dayjs(s)
  return d.isValid() ? d.format('YYYY-MM-DD') : null
}

const formatHora = (v: unknown): string | null => {
  if (typeof v === 'string' && v.length >= 5) {
    return v.slice(0, 5)
  }
  if (Array.isArray(v) && v.length >= 2) {
    const h = Number(v[0])
    const m = Number(v[1])
    if (Number.isFinite(h) && Number.isFinite(m)) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    }
  }
  const o = asRecord(v)
  if (o) {
    const h = toNumber(o.hour ?? o.hora)
    const m = toNumber(o.minute ?? o.minuto)
    if (h !== null && m !== null && h >= 0 && h < 24 && m >= 0 && m < 60) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    }
  }
  return null
}

export function getConsultaDataIso(c: ConsultaDTO): string | null {
  const dataAgenda = typeof c.dataAgenda === 'string' ? c.dataAgenda : ''
  return dataAgenda ? toYmdCalendario(dataAgenda) : null
}

export function getConsultaId(c: ConsultaDTO): number | null {
  return toNumber(c.id)
}

export function getMedicoNomeConsulta(c: ConsultaDTO): string {
  return firstNonEmptyString(c.nomeMedico) ?? '—'
}

export function getPacienteNomeConsulta(c: ConsultaDTO): string {
  return firstNonEmptyString(c.nomePaciente) ?? '—'
}

const normalizeStatus = (s: string): string => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()

export function getStatusConsultaLabel(c: ConsultaDTO): string {
  const raw = firstNonEmptyString(c.statusConsulta, c.status) ?? ''
  return raw.trim() || '—'
}

export function isConsultaFinalizada(c: ConsultaDTO): boolean {
  const label = normalizeStatus(getStatusConsultaLabel(c))
  return label.includes('FINALIZ')
}

export function getEspecialidadeNomeConsulta(c: ConsultaDTO): string {
  return firstNonEmptyString(c.nomeEspecialidade) ?? '—'
}

export function getHorarioLabel(c: ConsultaDTO): string {
  const hi = formatHora(c.horaInicio)
  const hf = formatHora(c.horaFim)
  const start = hi ?? '—'
  const end = hf
  return end && end !== start ? `${start}–${end}` : start
}

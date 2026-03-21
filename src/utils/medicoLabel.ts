import type { MedicoEspecialidadeDTO } from '../types/resources'
import type { TipoUsuarioDTO, UsuarioDTO } from '../types/user'

const toString = (value: unknown): string => {
  if (typeof value === 'string') {
    return value
  }
  if (value === undefined || value === null) {
    return ''
  }
  return String(value)
}

const normalizeText = (value: unknown): string =>
  toString(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim()

/** Tenta ler nome em objetos aninhados típicos de entidades JPA (medico, usuario, etc.). */
function pickNomeFromUnknown(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) {
    return value.trim()
  }
  if (!value || typeof value !== 'object') {
    return null
  }
  const o = value as Record<string, unknown>
  for (const key of ['nome', 'nomeCompleto', 'nomeUsuario', 'nomeSocial']) {
    const v = o[key]
    if (typeof v === 'string' && v.trim()) {
      return v.trim()
    }
  }
  const nestedUsuario = pickNomeFromUnknown(o.usuario)
  if (nestedUsuario) {
    return nestedUsuario
  }
  return pickNomeFromUnknown(o.medico)
}

/**
 * Extrai o nome exibível a partir do JSON de vínculo médico–especialidade.
 * API atual: `medico: MedicoResumoDTO { id, nome }`; mantém fallbacks para formatos antigos.
 */
export function extractNomeFromMedicoEspecialidadeLink(item: MedicoEspecialidadeDTO): string | null {
  const fromResumo = item.medico?.nome?.trim()
  if (fromResumo) {
    return fromResumo
  }
  const record = item as unknown as Record<string, unknown>
  for (const key of [
    'nomeMedico',
    'nome',
    'nomeUsuario',
    'nomeCompleto',
    'nomeMedicoEspecialidade',
    'medicoNome',
  ]) {
    const v = record[key]
    if (typeof v === 'string' && v.trim()) {
      return v.trim()
    }
  }
  const fromMedico = pickNomeFromUnknown(record.medico)
  if (fromMedico) {
    return fromMedico
  }
  const fromUsuario = pickNomeFromUnknown(record.usuario)
  if (fromUsuario) {
    return fromUsuario
  }
  return null
}

export function resolveMedicoNome(
  item: MedicoEspecialidadeDTO,
  nomePorUsuarioId?: Map<number, string>
): string {
  const id = Number(item.medicoId)
  if (Number.isFinite(id) && nomePorUsuarioId?.has(id)) {
    return nomePorUsuarioId.get(id) as string
  }
  return extractNomeFromMedicoEspecialidadeLink(item) ?? `Médico #${item.medicoId}`
}

/** Mesma regra de “quem é médico” usada em AgendaMedicoPage — para preencher nome via GET /usuarios. */
export function buildNomePorMedicoIdFromUsuarios(
  usuarios: UsuarioDTO[],
  tiposUsuario: TipoUsuarioDTO[]
): Map<number, string> {
  const medicoTipoIds = new Set(
    tiposUsuario
      .filter((tipo) => normalizeText(tipo.nome).includes('MEDIC'))
      .map((tipo) => tipo.id)
  )

  const map = new Map<number, string>()
  usuarios.forEach((user) => {
    const tipoById = user.tipoUsuarioId ? medicoTipoIds.has(user.tipoUsuarioId) : false
    const tipoByName = normalizeText(user.tipoUsuarioNome ?? user.tipoUsuario).includes('MEDIC')
    const roleByName = normalizeText((user as unknown as Record<string, unknown>).role).includes('MEDIC')
    const isMedico = tipoById || tipoByName || roleByName
    if (isMedico && user.id) {
      map.set(user.id, user.nome)
    }
  })
  return map
}

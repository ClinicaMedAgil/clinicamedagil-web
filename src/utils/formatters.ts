import type { TipoUsuarioDTO } from '../types/user'

export const onlyDigits = (value: string): string => value.replace(/\D/g, '')

export const formatCpf = (value: string): string => {
  const digits = onlyDigits(value).slice(0, 11)

  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2')
}

export const formatPhone = (value: string): string => {
  const digits = onlyDigits(value).slice(0, 11)

  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/g, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }

  return digits
    .replace(/^(\d{2})(\d)/g, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
}

export const getTipoUsuarioLabel = (
  tipoUsuarioId: number | undefined,
  tiposUsuarios: TipoUsuarioDTO[]
): string => {
  if (!tipoUsuarioId) {
    return '-'
  }

  const tipoEncontrado = tiposUsuarios.find((tipo) => tipo.id === tipoUsuarioId)
  return tipoEncontrado?.nome ?? `Tipo #${tipoUsuarioId}`
}

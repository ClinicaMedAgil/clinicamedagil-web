import type { PerfilDTO } from '../types/resources'

const normalizeText = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim()

const readPerfilNome = (p: PerfilDTO): string => {
  const r = p as Record<string, unknown>
  const raw = r.nomePerfil ?? r.nome ?? r.descricao
  return typeof raw === 'string' ? raw.trim() : ''
}

/**
 * Escolhe o `perfilId` coerente com o nome do tipo de usuário (mesma ideia do UserRoleResolver no backend:
 * papel alinhado a tipo/perfil). Usado no cadastro/edição para enviar os dois IDs juntos.
 */
export function findPerfilIdForTipoUsuarioNome(
  tipoUsuarioNome: string,
  perfis: PerfilDTO[]
): number | undefined {
  if (!perfis.length) {
    return undefined
  }

  const t = normalizeText(tipoUsuarioNome)

  const firstMatch = (predicate: (perfilNorm: string) => boolean): number | undefined => {
    for (const p of perfis) {
      const id = p.id
      if (!id) {
        continue
      }
      const n = normalizeText(readPerfilNome(p))
      if (n && predicate(n)) {
        return id
      }
    }
    return undefined
  }

  if (t.includes('MEDIC')) {
    return (
      firstMatch((n) => n.includes('MEDIC')) ??
      firstMatch((n) => n === 'MEDICO') ??
      firstMatch((n) => n.includes('DOCTOR'))
    )
  }

  if (t.includes('ADMIN')) {
    return firstMatch((n) => n.includes('ADMIN'))
  }

  if (t.includes('ATENDENTE')) {
    return firstMatch((n) => n.includes('ATENDENTE'))
  }

  if (t.includes('PACIENT') || t.includes('USUARIO') || t === 'USER') {
    return (
      firstMatch((n) => n.includes('PACIENT')) ??
      firstMatch((n) => n.includes('USUARIO')) ??
      firstMatch((n) => n.includes('USER'))
    )
  }

  return undefined
}

import type { AxiosError } from 'axios'

export interface UsuarioApiConflictBody {
  mensagem?: string
  erros?: Array<{ campo?: string; erro?: string }>
}

export type Usuario409Parsed =
  | { ok: false }
  | {
      ok: true
      fieldErrors: Partial<Record<'cpf' | 'email', string>>
      globalMessage: string | null
    }

const mergeText = (prev: string | undefined, next: string): string => {
  if (!prev) {
    return next
  }
  return prev.includes(next) ? prev : `${prev} ${next}`
}

const normalizeCampo = (campo: string | undefined): string =>
  typeof campo === 'string' ? campo.trim().toLowerCase() : ''

/** Resposta 409 da API de usuários: { mensagem, erros: [{ campo, erro }] } */
export function parseUsuario409(error: unknown): Usuario409Parsed {
  const ax = error as AxiosError<UsuarioApiConflictBody>
  if (ax.response?.status !== 409) {
    return { ok: false }
  }

  const body = ax.response.data ?? {}
  const lista = Array.isArray(body.erros) ? body.erros : []
  const fieldErrors: Partial<Record<'cpf' | 'email', string>> = {}
  const outros: string[] = []

  for (const item of lista) {
    const erro = typeof item.erro === 'string' ? item.erro.trim() : ''
    if (!erro) {
      continue
    }
    const key = normalizeCampo(item.campo)
    if (key === 'cpf') {
      fieldErrors.cpf = mergeText(fieldErrors.cpf, erro)
    } else if (key === 'email') {
      fieldErrors.email = mergeText(fieldErrors.email, erro)
    } else {
      outros.push(erro)
    }
  }

  const mensagem = typeof body.mensagem === 'string' ? body.mensagem.trim() : ''
  const globalParts = [mensagem, ...outros].filter(Boolean)
  const globalMessage = globalParts.length ? globalParts.join(' ') : null

  return { ok: true, fieldErrors, globalMessage }
}

import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import { buildCreateConsultaPayload, parseConsultaApiError } from './consultaForm.helpers'

describe('buildCreateConsultaPayload', () => {
  it('monta payload válido com data ISO', () => {
    const payload = buildCreateConsultaPayload({
      agendamentoId: 1,
      medicoId: 2,
      pacienteId: 3,
      dataConsulta: dayjs('2026-03-20T14:30:00'),
      queixaPrincipal: ' Dor de cabeça ',
    })

    expect(payload.agendamentoId).toBe(1)
    expect(payload.medicoId).toBe(2)
    expect(payload.pacienteId).toBe(3)
    expect(dayjs(payload.dataConsulta).isValid()).toBe(true)
    expect(payload.queixaPrincipal).toBe('Dor de cabeça')
  })

  it('falha quando ids obrigatórios são inválidos', () => {
    expect(() =>
      buildCreateConsultaPayload({
        agendamentoId: 0,
        medicoId: 2,
        pacienteId: 3,
      })
    ).toThrow('Agendamento inválido.')
  })
})

describe('parseConsultaApiError', () => {
  it('traz mensagem padrão para 403', () => {
    const parsed = parseConsultaApiError({
      response: { status: 403, data: {} },
    })
    expect(parsed.message).toBe('Você não tem permissão.')
  })

  it('mapeia field errors no 422', () => {
    const parsed = parseConsultaApiError({
      response: {
        status: 422,
        data: { errors: { pacienteId: ['Paciente inválido'] } },
      },
    })
    expect(parsed.fieldErrors.pacienteId).toBe('Paciente inválido')
  })
})

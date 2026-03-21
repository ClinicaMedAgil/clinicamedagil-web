import { ScheduleOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Modal, Select, Space, Spin, Table, Typography, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../../hooks/useAuth'
import { consultaService } from '../../services/consultaService'
import { pacienteAgendaService } from '../../services/pacienteAgendaService'
import { pacienteAgendamentoCatalogoService } from '../../services/pacienteAgendamentoCatalogoService'
import { tipoUsuarioService } from '../../services/tipoUsuarioService'
import { userService } from '../../services/userService'
import type {
  AgendaHorariosDisponiveisDTO,
  AgendaMedicoDTO,
  EspecialidadeDTO,
  HorarioAgendaDTO,
  MedicoEspecialidadeDTO,
} from '../../types/resources'
import type { TipoUsuarioDTO, UsuarioDTO } from '../../types/user'
import { buildNomePorMedicoIdFromUsuarios, resolveMedicoNome } from '../../utils/medicoLabel'

const toNumber = (value: unknown): number | null => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

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

const nomeEspecialidadeCoerenteComCatalogo = (
  nomeNoPayload: string,
  especialidadeCatalogo: EspecialidadeDTO | undefined
): boolean => {
  if (!especialidadeCatalogo) {
    return false
  }
  const candidatos = [especialidadeCatalogo.nomeEspecialidade, especialidadeCatalogo.descricao]
    .map((v) => toString(v).trim())
    .filter(Boolean)
  if (candidatos.length === 0) {
    return false
  }
  const alvo = normalizeText(nomeNoPayload)
  return candidatos.some((c) => normalizeText(c) === alvo)
}

const getAgendaDate = (agenda: AgendaMedicoDTO): string => {
  const text = toString(agenda.dataAgenda).trim()
  if (!text) {
    return ''
  }
  return text.slice(0, 10)
}

const getEspecialidadeNested = (
  link: MedicoEspecialidadeDTO
): { id?: number; nome?: string } | undefined => {
  const r = link as unknown as Record<string, unknown>
  const esp = r.especialidade ?? r.Especialidade
  if (!esp || typeof esp !== 'object') {
    return undefined
  }
  return esp as { id?: number; nome?: string }
}

const idsDoVinculoBatemComEspecialidade = (
  link: MedicoEspecialidadeDTO,
  selectedEspecialidadeId: number
): boolean => {
  const espNested = getEspecialidadeNested(link)
  const idNested = toNumber(espNested?.id)
  const idFlat = toNumber(link.especialidadeId)

  if (idNested != null && idFlat != null && idNested !== idFlat) {
    return false
  }

  if (idNested != null && idFlat != null) {
    return idNested === selectedEspecialidadeId && idFlat === selectedEspecialidadeId
  }
  if (idNested != null) {
    return idNested === selectedEspecialidadeId
  }
  if (idFlat != null) {
    return idFlat === selectedEspecialidadeId
  }
  return false
}

const medicoPertenceAEspecialidadeEscolhida = (
  link: MedicoEspecialidadeDTO,
  selectedEspecialidadeId: number,
  especialidadeCatalogo: EspecialidadeDTO | undefined
): boolean => {
  const nomeNoVinculo = getEspecialidadeNested(link)?.nome?.trim()
  if (nomeNoVinculo) {
    return nomeEspecialidadeCoerenteComCatalogo(nomeNoVinculo, especialidadeCatalogo)
  }
  return idsDoVinculoBatemComEspecialidade(link, selectedEspecialidadeId)
}

interface LinhaHorarioDisponivel {
  key: string
  horarioId: number
  medicoId: number
  especialidadeId: number
  medicoNome: string
  especialidadeNome: string
  dataLabel: string
  horarioLabel: string
  sortKey: number
}

const ConsultaAgendarPage = () => {
  const navigate = useNavigate()
  const { roles } = useAuth()
  const podeEnriquecerNomesViaUsuarios = roles.includes('ADMIN') || roles.includes('ATENDENTE')

  const [linhas, setLinhas] = useState<LinhaHorarioDisponivel[]>([])
  const [especialidades, setEspecialidades] = useState<EspecialidadeDTO[]>([])
  const [filtroEspecialidadeId, setFiltroEspecialidadeId] = useState<number | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submittingId, setSubmittingId] = useState<number | null>(null)
  const [usuariosParaNomes, setUsuariosParaNomes] = useState<UsuarioDTO[]>([])
  const [tiposUsuarioParaNomes, setTiposUsuarioParaNomes] = useState<TipoUsuarioDTO[]>([])

  const nomePorMedicoId = useMemo(
    () => buildNomePorMedicoIdFromUsuarios(usuariosParaNomes, tiposUsuarioParaNomes),
    [usuariosParaNomes, tiposUsuarioParaNomes]
  )

  const loadLinhas = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const especialidadesData = await pacienteAgendamentoCatalogoService.listEspecialidades()
      setEspecialidades(especialidadesData)

      type Pair = {
        espId: number
        medicoId: number
        link: MedicoEspecialidadeDTO
        espCatalogo: EspecialidadeDTO
      }
      const pairMap = new Map<string, Pair>()

      await Promise.all(
        especialidadesData.map(async (esp) => {
          const eid = toNumber(esp.id)
          if (!eid) {
            return
          }
          try {
            const meds = await pacienteAgendamentoCatalogoService.listMedicos(eid)
            for (const link of meds) {
              if (!medicoPertenceAEspecialidadeEscolhida(link, eid, esp)) {
                continue
              }
              const mid = toNumber(link.medicoId)
              if (!mid) {
                continue
              }
              const key = `${eid}-${mid}`
              if (!pairMap.has(key)) {
                pairMap.set(key, { espId: eid, medicoId: mid, link, espCatalogo: esp })
              }
            }
          } catch {
            /* especialidade sem médicos ou erro de rede */
          }
        })
      )

      const horariosPorPar = await Promise.all(
        [...pairMap.values()].map(async (p) => {
          try {
            const blocks = await pacienteAgendaService.listHorariosDisponiveis(p.espId, p.medicoId)
            return { pair: p, blocks }
          } catch {
            return { pair: p, blocks: [] as AgendaHorariosDisponiveisDTO[] }
          }
        })
      )

      const out: LinhaHorarioDisponivel[] = []

      for (const { pair, blocks } of horariosPorPar) {
        for (const { agenda, horariosDisponiveis } of blocks) {
          const dateStr = getAgendaDate(agenda)
          const nomeMed =
            toString(agenda.nomeMedico).trim() ||
            resolveMedicoNome(pair.link, nomePorMedicoId)
          const nomeEsp =
            toString(agenda.nomeEspecialidade).trim() ||
            toString(pair.espCatalogo.nomeEspecialidade) ||
            toString(pair.espCatalogo.descricao) ||
            `Especialidade #${pair.espId}`

          horariosDisponiveis.forEach((h: HorarioAgendaDTO) => {
            const hid = toNumber(h.id)
            if (!hid) {
              return
            }
            const st = toString(h.statusHorario).toUpperCase()
            if (st && st !== 'DISPONIVEL') {
              return
            }

            const hi = h.horaInicio?.slice(0, 5) ?? ''
            const hf = h.horaFim?.slice(0, 5) ?? ''
            const dataLabel =
              dateStr && dayjs(dateStr).isValid()
                ? dayjs(dateStr).format('DD/MM/YYYY')
                : dateStr || '—'
            const horarioLabel = `${hi}–${hf}`
            const sortKey = dayjs(`${dateStr}T${h.horaInicio ?? '00:00:00'}`).isValid()
              ? dayjs(`${dateStr}T${h.horaInicio}`).valueOf()
              : 0

            out.push({
              key: `h-${hid}`,
              horarioId: hid,
              medicoId: pair.medicoId,
              especialidadeId: pair.espId,
              medicoNome: nomeMed,
              especialidadeNome: nomeEsp,
              dataLabel,
              horarioLabel,
              sortKey,
            })
          })
        }
      }

      out.sort((a, b) => a.sortKey - b.sortKey)
      setLinhas(out)
    } catch {
      setError('Não foi possível carregar os horários disponíveis.')
      setLinhas([])
    } finally {
      setLoading(false)
    }
  }, [nomePorMedicoId])

  useEffect(() => {
    void loadLinhas()
  }, [loadLinhas])

  useEffect(() => {
    if (!podeEnriquecerNomesViaUsuarios) {
      setUsuariosParaNomes([])
      setTiposUsuarioParaNomes([])
      return
    }

    let cancelled = false
    const run = async () => {
      try {
        const [usuarios, tipos] = await Promise.all([userService.list(), tipoUsuarioService.list()])
        if (!cancelled) {
          setUsuariosParaNomes(usuarios)
          setTiposUsuarioParaNomes(tipos)
        }
      } catch {
        if (!cancelled) {
          setUsuariosParaNomes([])
          setTiposUsuarioParaNomes([])
        }
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [podeEnriquecerNomesViaUsuarios])

  const especialidadeFilterOptions = useMemo(
    () =>
      especialidades.map((item) => ({
        value: toNumber(item.id) ?? 0,
        label:
          toString(item.nomeEspecialidade) ||
          toString(item.descricao) ||
          `Especialidade #${item.id ?? '-'}`,
      })),
    [especialidades]
  )

  const linhasFiltradas = useMemo(() => {
    if (filtroEspecialidadeId == null) {
      return linhas
    }
    return linhas.filter((l) => l.especialidadeId === filtroEspecialidadeId)
  }, [linhas, filtroEspecialidadeId])

  const solicitarAgendamento = (linha: LinhaHorarioDisponivel) => {
    Modal.confirm({
      title: 'Confirmar agendamento',
      content: (
        <div>
          <p>
            <strong>Médico:</strong> {linha.medicoNome}
          </p>
          <p>
            <strong>Especialidade:</strong> {linha.especialidadeNome}
          </p>
          <p>
            <strong>Data:</strong> {linha.dataLabel}
          </p>
          <p>
            <strong>Horário:</strong> {linha.horarioLabel}
          </p>
          <p style={{ marginTop: 12 }}>Deseja confirmar a consulta neste horário?</p>
        </div>
      ),
      okText: 'Confirmar',
      cancelText: 'Cancelar',
      onOk: async () => {
        setSubmittingId(linha.horarioId)
        try {
          await consultaService.salvar({ horarioId: linha.horarioId })
          message.success('Consulta agendada com sucesso.')
          navigate('/app/consultas', { replace: true })
        } finally {
          setSubmittingId(null)
        }
      },
    })
  }

  const columns: ColumnsType<LinhaHorarioDisponivel> = [
    {
      title: 'Médico',
      dataIndex: 'medicoNome',
      key: 'medicoNome',
      ellipsis: true,
    },
    {
      title: 'Especialidade',
      dataIndex: 'especialidadeNome',
      key: 'especialidadeNome',
      ellipsis: true,
    },
    {
      title: 'Data',
      dataIndex: 'dataLabel',
      key: 'dataLabel',
      width: 120,
    },
    {
      title: 'Horário',
      dataIndex: 'horarioLabel',
      key: 'horarioLabel',
      width: 110,
    },
    {
      title: 'Ação',
      key: 'acao',
      width: 180,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          loading={submittingId === record.horarioId}
          onClick={() => solicitarAgendamento(record)}
        >
          Agendar consulta
        </Button>
      ),
    },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Space align="center">
        <ScheduleOutlined style={{ fontSize: 22 }} />
        <Typography.Title level={4} style={{ margin: 0 }}>
          Agendar consulta
        </Typography.Title>
      </Space>

      <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
        Horários livres por médico e especialidade. Use o botão para confirmar e agendar.
      </Typography.Paragraph>

      {error && <Alert type="error" message={error} showIcon />}

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap align="center">
            <Typography.Text strong>Filtrar por especialidade</Typography.Text>
            <Select
              allowClear
              placeholder="Todas as especialidades"
              style={{ minWidth: 280 }}
              options={especialidadeFilterOptions}
              value={filtroEspecialidadeId}
              onChange={(v) => setFiltroEspecialidadeId(v ?? undefined)}
              showSearch
              optionFilterProp="label"
              disabled={loading && especialidades.length === 0}
            />
          </Space>

          <Spin spinning={loading}>
            <Table<LinhaHorarioDisponivel>
              rowKey="key"
              columns={columns}
              dataSource={linhasFiltradas}
              pagination={{ pageSize: 10, showSizeChanger: true }}
              locale={{
                emptyText: loading
                  ? 'Carregando…'
                  : filtroEspecialidadeId != null
                    ? 'Nenhum horário disponível para esta especialidade.'
                    : 'Nenhum horário disponível no momento.',
              }}
              scroll={{ x: true }}
            />
          </Spin>
        </Space>
      </Card>
    </Space>
  )
}

export default ConsultaAgendarPage

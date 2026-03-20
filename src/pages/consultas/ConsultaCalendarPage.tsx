import {
  Alert,
  Button,
  Calendar,
  Card,
  DatePicker,
  Empty,
  Form,
  Input,
  List,
  Modal,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from 'antd'
import type { CalendarProps } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../../hooks/useAuth'
import { authService } from '../../services/authService'
import { agendamentoService } from '../../services/agendamentoService'
import { consultaService } from '../../services/consultaService'
import { especialidadeService } from '../../services/especialidadeService'
import { medicoEspecialidadeService } from '../../services/medicoEspecialidadeService'
import { userService } from '../../services/userService'
import type {
  AgendamentoDTO,
  ConsultaCreatePayload,
  ConsultaDTO,
  EspecialidadeDTO,
} from '../../types/resources'
import type { UsuarioDTO } from '../../types/user'
import {
  buildCreateConsultaPayload,
  type ConsultaFormValues,
  parseConsultaApiError,
} from './consultaForm.helpers'
import './ConsultaCalendarPage.css'

interface ConsultaItem {
  id?: number
  agendamentoId?: number
  dataKey: string
  horaLabel: string
  dataIso?: string
  statusLabel: string
  pacienteNome: string
  medicoNome: string
  especialidadeId?: number
  especialidadeNome?: string
  observacao: string
  idPaciente?: string
  idMedico?: string
  cpfPaciente?: string
  cpfMedico?: string
  emailPaciente?: string
  emailMedico?: string
}

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {}

const getStringField = (record: Record<string, unknown>, ...keys: string[]): string | null => {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }
  return null
}

const getNumberField = (record: Record<string, unknown>, ...keys: string[]): number | null => {
  for (const key of keys) {
    const value = record[key]
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }
  return null
}

const normalizeId = (value: unknown): string | null => {
  if (value === null || value === undefined) {
    return null
  }
  const text = String(value).trim()
  return text.length > 0 ? text : null
}

const normalizeTextKey = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null
  }
  const text = value.trim().toLowerCase()
  return text.length > 0 ? text : null
}

const parseConsulta = (raw: ConsultaDTO): ConsultaItem | null => {
  const record = asRecord(raw)
  const paciente = asRecord(record.paciente)
  const medico = asRecord(record.medico)
  const agendamento = asRecord(record.agendamento)
  const especialidade = asRecord(record.especialidade)

  const dateValue =
    getStringField(record, 'dataConsulta', 'data_consulta', 'data', 'dataAgendada', 'data_hora_consulta') ??
    getStringField(agendamento, 'dataConsulta', 'data', 'dataAgendada')

  if (!dateValue) {
    return null
  }

  const parsedDate = dayjs(dateValue)
  if (!parsedDate.isValid()) {
    return null
  }

  const hourText =
    getStringField(record, 'horaConsulta', 'hora_consulta', 'horario', 'hora') ??
    (dateValue.includes('T') ? parsedDate.format('HH:mm') : '--:--')

  const statusLabel = getStringField(record, 'status', 'situacao') ?? 'SEM STATUS'

  const pacienteNome =
    getStringField(record, 'nomePaciente', 'pacienteNome') ??
    getStringField(paciente, 'nome') ??
    `Paciente #${getNumberField(record, 'id_paciente', 'idPaciente') ?? getNumberField(paciente, 'id') ?? '-'}`

  const medicoNome =
    getStringField(record, 'nomeMedico', 'medicoNome') ??
    getStringField(medico, 'nome') ??
    `Médico #${getNumberField(record, 'id_medico', 'idMedico') ?? getNumberField(medico, 'id') ?? '-'}`

  const idPacienteRaw = getNumberField(record, 'id_paciente', 'idPaciente') ?? getNumberField(paciente, 'id')
  const idMedicoRaw = getNumberField(record, 'id_medico', 'idMedico') ?? getNumberField(medico, 'id')
  const cpfPaciente = getStringField(record, 'cpf_paciente', 'cpfPaciente') ?? getStringField(paciente, 'cpf')
  const cpfMedico = getStringField(record, 'cpf_medico', 'cpfMedico') ?? getStringField(medico, 'cpf')
  const emailPaciente =
    getStringField(record, 'email_paciente', 'emailPaciente') ?? getStringField(paciente, 'email')
  const emailMedico = getStringField(record, 'email_medico', 'emailMedico') ?? getStringField(medico, 'email')

  return {
    id: getNumberField(record, 'id') ?? undefined,
    agendamentoId:
      getNumberField(record, 'agendamentoId', 'idAgendamento') ?? getNumberField(agendamento, 'id') ?? undefined,
    dataKey: parsedDate.format('YYYY-MM-DD'),
    horaLabel: hourText,
    dataIso: parsedDate.toISOString(),
    statusLabel,
    pacienteNome,
    medicoNome,
    especialidadeId:
      getNumberField(record, 'especialidadeId', 'idEspecialidade') ??
      getNumberField(agendamento, 'especialidadeId', 'idEspecialidade') ??
      getNumberField(especialidade, 'id') ??
      undefined,
    especialidadeNome:
      getStringField(record, 'especialidadeNome') ??
      getStringField(agendamento, 'especialidadeNome') ??
      getStringField(especialidade, 'nomeEspecialidade') ??
      undefined,
    observacao: getStringField(record, 'observacao', 'observacoes', 'descricao') ?? '-',
    idPaciente: normalizeId(idPacienteRaw) ?? undefined,
    idMedico: normalizeId(idMedicoRaw) ?? undefined,
    cpfPaciente: normalizeTextKey(cpfPaciente) ?? undefined,
    cpfMedico: normalizeTextKey(cpfMedico) ?? undefined,
    emailPaciente: normalizeTextKey(emailPaciente) ?? undefined,
    emailMedico: normalizeTextKey(emailMedico) ?? undefined,
  }
}

interface AgendamentoOption {
  id: number
  medicoId: number | null
  especialidadeId: number | null
  dataISO: string
  label: string
}

interface ConsultaCreateFormValues extends ConsultaFormValues {
  especialidadeId?: number
}

const getRoleName = (value: unknown): string => {
  if (typeof value !== 'string') {
    return ''
  }
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/^ROLE_/, '')
    .trim()
}

const isTipo = (user: UsuarioDTO, token: string): boolean => {
  const fromTipoNome = getRoleName(user.tipoUsuarioNome ?? user.tipoUsuario)
  const fromRole = getRoleName((user as unknown as Record<string, unknown>).role)
  return fromTipoNome.includes(token) || fromRole.includes(token)
}

const parseAgendamentoOption = (item: AgendamentoDTO): AgendamentoOption | null => {
  const raw = asRecord(item)
  const id = getNumberField(raw, 'id')
  const medicoId =
    getNumberField(raw, 'medicoId', 'idMedico') ?? getNumberField(asRecord(raw.medico), 'id', 'medicoId')
  const especialidadeId =
    getNumberField(raw, 'especialidadeId', 'idEspecialidade') ??
    getNumberField(asRecord(raw.especialidade), 'id', 'especialidadeId')

  const dataISO =
    getStringField(raw, 'dataAgendamento', 'dataConsulta', 'data', 'dataHora') ??
    getStringField(asRecord(raw.horario), 'dataAgendamento', 'dataConsulta', 'data')

  if (!id || !dataISO) {
    return null
  }

  const parsedDate = dayjs(dataISO)
  if (!parsedDate.isValid()) {
    return null
  }

  const medicoNome =
    getStringField(raw, 'nomeMedico', 'medicoNome') ?? getStringField(asRecord(raw.medico), 'nome') ?? '-'

  return {
    id,
    medicoId,
    especialidadeId,
    dataISO: parsedDate.toISOString(),
    label: `${parsedDate.format('DD/MM/YYYY HH:mm')} - ${medicoNome}`,
  }
}

const ConsultaCalendarPage = () => {
  const navigate = useNavigate()
  const { roles } = useAuth()
  const sessionUser = useMemo(() => authService.getSessionUser(), [])
  const [createForm] = Form.useForm<ConsultaCreateFormValues>()
  const [loading, setLoading] = useState(true)
  const [loadingCreateModalData, setLoadingCreateModalData] = useState(false)
  const [savingCreate, setSavingCreate] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [consultas, setConsultas] = useState<ConsultaItem[]>([])
  const [agendamentos, setAgendamentos] = useState<AgendamentoOption[]>([])
  const [users, setUsers] = useState<UsuarioDTO[]>([])
  const [especialidades, setEspecialidades] = useState<EspecialidadeDTO[]>([])
  const [medicoEspecialidades, setMedicoEspecialidades] = useState<Array<{ medicoId: number; especialidadeId: number }>>(
    []
  )
  const [openCreateModal, setOpenCreateModal] = useState(false)
  const [openEditModal, setOpenEditModal] = useState(false)
  const [editingConsulta, setEditingConsulta] = useState<ConsultaItem | null>(null)
  const [selectedDate, setSelectedDate] = useState(dayjs())
  const [fallbackUserId, setFallbackUserId] = useState<string | null>(null)
  const [usesScopedEndpoint, setUsesScopedEndpoint] = useState(false)

  const currentUserId = useMemo(
    () => normalizeId(sessionUser?.id) ?? fallbackUserId,
    [fallbackUserId, sessionUser?.id]
  )
  const currentUserCpf = useMemo(() => normalizeTextKey(sessionUser?.cpf), [sessionUser?.cpf])
  const currentUserEmail = useMemo(() => normalizeTextKey(sessionUser?.email), [sessionUser?.email])

  const isAdminOrAtendente = useMemo(
    () => roles.includes('ADMIN') || roles.includes('ATENDENTE'),
    [roles]
  )
  const canCreateConsulta = useMemo(
    () => roles.includes('PACIENTE') || roles.includes('ATENDENTE') || roles.includes('ADMIN'),
    [roles]
  )
  const isPaciente = useMemo(() => !isAdminOrAtendente && roles.includes('PACIENTE'), [isAdminOrAtendente, roles])

  const isMedicoOnly = useMemo(
    () => !isAdminOrAtendente && roles.includes('MEDICO'),
    [isAdminOrAtendente, roles]
  )

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await (() => {
        if (isAdminOrAtendente) {
          setUsesScopedEndpoint(false)
          return consultaService.list()
        }

        if (isMedicoOnly) {
          setUsesScopedEndpoint(true)
          return consultaService.listMedico()
        }

        setUsesScopedEndpoint(true)
        return consultaService.listPaciente()
      })()
      const parsed = data.map(parseConsulta).filter((item): item is ConsultaItem => item !== null)
      setConsultas(parsed)

      if (!isAdminOrAtendente && !normalizeId(sessionUser?.id)) {
        try {
          const me = await userService.getMe()
          setFallbackUserId(normalizeId(me?.id))
        } catch {
          setFallbackUserId(null)
        }
      }
    } catch {
      setError('Não foi possível carregar as consultas.')
    } finally {
      setLoading(false)
    }
  }, [isAdminOrAtendente, isMedicoOnly, sessionUser?.id])

  const loadCreateModalData = async () => {
    setLoadingCreateModalData(true)
    try {
      const [agendamentosData, especialidadesData, medicoEspecialidadeData] = await Promise.all([
        agendamentoService.list(),
        especialidadeService.list(),
        medicoEspecialidadeService.list(),
      ])

      setAgendamentos(
        agendamentosData
          .map(parseAgendamentoOption)
          .filter((item): item is AgendamentoOption => item !== null)
      )
      setEspecialidades(especialidadesData)
      setMedicoEspecialidades(
        medicoEspecialidadeData.filter((item) => item.medicoId > 0 && item.especialidadeId > 0)
      )

      try {
        const usersData = await userService.list()
        setUsers(usersData)
      } catch {
        setUsers([])
      }
    } catch {
      message.error('Não foi possível carregar dados para agendamento da consulta.')
    } finally {
      setLoadingCreateModalData(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [loadData])

  const visibleConsultas = useMemo(() => {
    if (isAdminOrAtendente) {
      return consultas
    }

    if (usesScopedEndpoint) {
      return consultas
    }

    if (!currentUserId) {
      if (!currentUserCpf && !currentUserEmail) {
        return []
      }
    }

    if (isMedicoOnly) {
      return consultas.filter(
        (consulta) =>
          (currentUserId && consulta.idMedico === currentUserId) ||
          (currentUserCpf && consulta.cpfMedico === currentUserCpf) ||
          (currentUserEmail && consulta.emailMedico === currentUserEmail)
      )
    }

    return consultas.filter(
      (consulta) =>
        (currentUserId && consulta.idPaciente === currentUserId) ||
        (currentUserCpf && consulta.cpfPaciente === currentUserCpf) ||
        (currentUserEmail && consulta.emailPaciente === currentUserEmail)
    )
  }, [
    consultas,
    currentUserCpf,
    currentUserEmail,
    currentUserId,
    isAdminOrAtendente,
    isMedicoOnly,
    usesScopedEndpoint,
  ])

  const consultasByDay = useMemo(() => {
    const grouped = new Map<string, ConsultaItem[]>()
    visibleConsultas.forEach((consulta) => {
      const list = grouped.get(consulta.dataKey) ?? []
      list.push(consulta)
      grouped.set(consulta.dataKey, list)
    })
    return grouped
  }, [visibleConsultas])

  const selectedDayKey = selectedDate.format('YYYY-MM-DD')
  const selectedDayConsultas = consultasByDay.get(selectedDayKey) ?? []

  const especialidadeOptions = useMemo(
    () =>
      especialidades.map((item) => ({
        value: Number(item.id),
        label: item.nomeEspecialidade ?? `Especialidade #${item.id ?? '-'}`,
      })),
    [especialidades]
  )
  const medicos = useMemo(() => users.filter((item) => isTipo(item, 'MEDIC')), [users])
  const pacientes = useMemo(() => users.filter((item) => isTipo(item, 'PACIENTE')), [users])
  const selectedEspecialidadeId = Form.useWatch('especialidadeId', createForm)
  const selectedMedicoId = Form.useWatch('medicoId', createForm)
  const selectedAgendamentoId = Form.useWatch('agendamentoId', createForm)

  const medicosDisponiveis = useMemo(() => {
    if (!selectedEspecialidadeId) {
      return []
    }
    const allowedMedicos = new Set(
      medicoEspecialidades
        .filter((item) => item.especialidadeId === selectedEspecialidadeId)
        .map((item) => item.medicoId)
    )
    return medicos
      .filter((item) => Number(item.id) > 0 && allowedMedicos.has(Number(item.id)))
      .map((item) => ({ value: Number(item.id), label: item.nome }))
  }, [medicoEspecialidades, medicos, selectedEspecialidadeId])

  const agendamentosDisponiveis = useMemo(() => {
    if (!selectedMedicoId || !selectedEspecialidadeId) {
      return []
    }

    return agendamentos.filter((item) => {
      if (item.medicoId !== selectedMedicoId) {
        return false
      }
      if (item.especialidadeId && item.especialidadeId !== selectedEspecialidadeId) {
        return false
      }
      const ocupado = consultas.some((consulta) => consulta.agendamentoId === item.id)
      return !ocupado
    })
  }, [agendamentos, consultas, selectedEspecialidadeId, selectedMedicoId])

  const pacienteOptions = useMemo(() => {
    if (isPaciente) {
      const ownId = Number(currentUserId)
      const fromUsers = pacientes.find((item) => Number(item.id) === ownId)
      return [{ value: ownId, label: fromUsers?.nome ?? sessionUser?.nome ?? `Paciente #${ownId}` }]
    }
    return pacientes
      .filter((item) => Number(item.id) > 0)
      .map((item) => ({ value: Number(item.id), label: item.nome }))
  }, [currentUserId, isPaciente, pacientes, sessionUser?.nome])

  const selectedAgendamento = useMemo(
    () => agendamentosDisponiveis.find((item) => item.id === selectedAgendamentoId),
    [agendamentosDisponiveis, selectedAgendamentoId]
  )

  useEffect(() => {
    if (!selectedAgendamento) {
      return
    }
    if (!createForm.getFieldValue('dataConsulta')) {
      createForm.setFieldValue('dataConsulta', dayjs(selectedAgendamento.dataISO))
    }
  }, [createForm, selectedAgendamento])

  const openNewConsultaModal = async () => {
    setOpenCreateModal(true)
    createForm.resetFields()
    await loadCreateModalData()
    if (isPaciente && currentUserId) {
      createForm.setFieldValue('pacienteId', Number(currentUserId))
    }
  }

  const closeCreateModal = () => {
    setOpenCreateModal(false)
    createForm.resetFields()
  }

  const apply422Errors = (fieldErrors: Record<string, string>) => {
    const fieldMap: Record<string, keyof ConsultaCreateFormValues> = {
      agendamentoId: 'agendamentoId',
      medicoId: 'medicoId',
      pacienteId: 'pacienteId',
      dataConsulta: 'dataConsulta',
      queixaPrincipal: 'queixaPrincipal',
      historiaDoencaAtual: 'historiaDoencaAtual',
      diagnostico: 'diagnostico',
      prescricao: 'prescricao',
      observacoes: 'observacoes',
    }
    const fields = Object.entries(fieldErrors)
      .map(([name, errorMessage]) => {
        const fieldName = fieldMap[name]
        if (!fieldName) {
          return null
        }
        return { name: fieldName, errors: [errorMessage] }
      })
      .filter((item): item is { name: keyof ConsultaCreateFormValues; errors: string[] } => item !== null)
    if (fields.length > 0) {
      createForm.setFields(fields)
    }
  }

  const handleCreateConsulta = async (values: ConsultaCreateFormValues) => {
    try {
      setSavingCreate(true)
      if (isPaciente && Number(values.pacienteId) !== Number(currentUserId)) {
        message.error('Paciente só pode criar consulta para si mesmo.')
        return
      }

      const payload = buildCreateConsultaPayload(values)

      const hasHorarioDuplicado = consultas.some(
        (item) =>
          Number(item.idPaciente) === payload.pacienteId &&
          item.dataIso &&
          dayjs(item.dataIso).isSame(dayjs(payload.dataConsulta ?? ''), 'minute')
      )
      if (hasHorarioDuplicado) {
        message.error('Já existe consulta neste horário para esse paciente.')
        return
      }

      const duplicateEspecialidade = consultas.find(
        (item) =>
          Number(item.idPaciente) === payload.pacienteId &&
          values.especialidadeId &&
          item.especialidadeId === values.especialidadeId
      )

      if (duplicateEspecialidade?.id) {
        const confirmed = await new Promise<boolean>((resolve) => {
          Modal.confirm({
            title: 'Especialidade já agendada',
            content:
              'Já existe consulta dessa especialidade para o paciente. Deseja apagar a consulta anterior para marcar uma nova?',
            okText: 'Sim, substituir',
            cancelText: 'Não',
            onOk: () => resolve(true),
            onCancel: () => resolve(false),
          })
        })

        if (!confirmed) {
          closeCreateModal()
          navigate('/app/consultas')
          return
        }

        await consultaService.remove(duplicateEspecialidade.id)
      }

      await consultaService.createConsulta(payload as ConsultaCreatePayload)
      message.success('Consulta cadastrada com sucesso!')
      closeCreateModal()
      await loadData()
      setSelectedDate(dayjs())
    } catch (requestError) {
      const parsed = parseConsultaApiError(requestError)
      if (parsed.status === 422) {
        apply422Errors(parsed.fieldErrors)
      }
      message.error(parsed.message)
    } finally {
      setSavingCreate(false)
    }
  }

  const openEditConsultaModal = async (consulta: ConsultaItem) => {
    if (!consulta.id) {
      return
    }
    setEditingConsulta(consulta)
    setOpenEditModal(true)
    await loadCreateModalData()
    createForm.setFieldsValue({
      agendamentoId: consulta.agendamentoId,
      medicoId: consulta.idMedico ? Number(consulta.idMedico) : undefined,
      pacienteId: consulta.idPaciente ? Number(consulta.idPaciente) : undefined,
      dataConsulta: consulta.dataIso ? dayjs(consulta.dataIso) : undefined,
      observacoes: consulta.observacao === '-' ? undefined : consulta.observacao,
    })
  }

  const closeEditConsultaModal = () => {
    setOpenEditModal(false)
    setEditingConsulta(null)
    createForm.resetFields()
  }

  const handleEditConsulta = async (values: ConsultaCreateFormValues) => {
    if (!editingConsulta?.id) {
      return
    }
    try {
      setSavingCreate(true)
      const payload = buildCreateConsultaPayload(values)
      await consultaService.update(editingConsulta.id, payload)
      message.success('Consulta atualizada com sucesso!')
      closeEditConsultaModal()
      await loadData()
    } catch (requestError) {
      const parsed = parseConsultaApiError(requestError)
      if (parsed.status === 422) {
        apply422Errors(parsed.fieldErrors)
      }
      message.error(parsed.message)
    } finally {
      setSavingCreate(false)
    }
  }

  const cellRender: CalendarProps<Dayjs>['cellRender'] = (current, info) => {
    if (info.type !== 'date') {
      return info.originNode
    }

    const dayKey = current.format('YYYY-MM-DD')
    const dayConsultas = consultasByDay.get(dayKey) ?? []

    if (dayConsultas.length === 0) {
      return <div className="consultas-calendar-cell-empty" />
    }

    return (
      <ul className="consultas-calendar-cell-list">
        {dayConsultas.slice(0, 2).map((item) => (
          <li key={`${dayKey}-${item.id ?? item.horaLabel}-${item.pacienteNome}`}>
            <Tag color="blue" className="consultas-calendar-tag">
              {item.horaLabel} - {item.pacienteNome}
            </Tag>
          </li>
        ))}
        {dayConsultas.length > 2 && (
          <li>
            <Typography.Text type="secondary">+{dayConsultas.length - 2} mais</Typography.Text>
          </li>
        )}
      </ul>
    )
  }

  return (
    <Card className="consultas-calendar-card" title="Calendário de Consultas">
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {!canCreateConsulta && (
          <Alert
            type="warning"
            showIcon
            message="Você não tem permissão para criar consulta."
            description="Apenas PACIENTE, ATENDENTE e ADMIN podem usar o fluxo de agendamento."
          />
        )}
        {canCreateConsulta && (
          <Button type="primary" onClick={() => void openNewConsultaModal()}>
            Agendar consulta
          </Button>
        )}
        {error && (
          <Alert
            type="error"
            showIcon
            message="Erro ao carregar consultas"
            description={error}
            action={
              <Button size="small" onClick={() => void loadData()}>
                Tentar novamente
              </Button>
            }
          />
        )}

        {!isAdminOrAtendente && !currentUserId && !currentUserCpf && !currentUserEmail && (
          <Alert
            type="warning"
            showIcon
            message="Sessão sem identificação do usuário"
            description="Não foi possível identificar o usuário logado para aplicar o filtro das consultas."
          />
        )}

        {loading ? (
          <Spin />
        ) : (
          <>
            <Calendar value={selectedDate} onSelect={setSelectedDate} cellRender={cellRender} />

            <Card size="small" title={`Consultas em ${selectedDate.format('DD/MM/YYYY')}`}>
              {selectedDayConsultas.length === 0 ? (
                <Empty description="Nenhuma consulta neste dia" />
              ) : (
                <List
                  dataSource={selectedDayConsultas}
                  renderItem={(item) => (
                    <List.Item>
                      <Space direction="vertical" size={2}>
                        <Typography.Text strong>
                          {item.horaLabel} - {item.pacienteNome}
                        </Typography.Text>
                        <Typography.Text type="secondary">Médico: {item.medicoNome}</Typography.Text>
                        <Typography.Text type="secondary">Status: {item.statusLabel}</Typography.Text>
                        <Typography.Text type="secondary">Obs: {item.observacao}</Typography.Text>
                        {(isAdminOrAtendente ||
                          (isMedicoOnly &&
                            dayjs().isSame(selectedDate, 'day') &&
                            item.idMedico === currentUserId)) && (
                          <Button size="small" onClick={() => void openEditConsultaModal(item)}>
                            {isAdminOrAtendente ? 'Editar consulta' : 'Registrar atendimento'}
                          </Button>
                        )}
                      </Space>
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </>
        )}
      </Space>
      <Modal
        title="Nova Consulta"
        open={openCreateModal}
        onCancel={closeCreateModal}
        footer={null}
        destroyOnClose
        width={720}
      >
        {loadingCreateModalData ? (
          <Spin />
        ) : (
          <Form<ConsultaCreateFormValues>
            layout="vertical"
            form={createForm}
            onFinish={handleCreateConsulta}
          >
            <Form.Item
              name="especialidadeId"
              label="Especialidade"
              rules={[{ required: true, message: 'Selecione a especialidade.' }]}
            >
              <Select
                placeholder="Selecione a especialidade"
                options={especialidadeOptions.filter((item) => Number.isFinite(item.value) && item.value > 0)}
                onChange={() => {
                  createForm.setFieldsValue({ medicoId: undefined, agendamentoId: undefined })
                }}
              />
            </Form.Item>

            <Form.Item name="medicoId" label="Médico" rules={[{ required: true, message: 'Selecione o médico.' }]}>
              <Select
                placeholder={selectedEspecialidadeId ? 'Selecione o médico' : 'Escolha a especialidade primeiro'}
                disabled={!selectedEspecialidadeId}
                options={medicosDisponiveis}
                onChange={() => createForm.setFieldValue('agendamentoId', undefined)}
              />
            </Form.Item>

            <Form.Item
              name="agendamentoId"
              label="Agendamento"
              rules={[{ required: true, message: 'Selecione o agendamento.' }]}
            >
              <Select
                placeholder={selectedMedicoId ? 'Selecione o horário disponível' : 'Escolha o médico primeiro'}
                disabled={!selectedMedicoId}
                options={agendamentosDisponiveis.map((item) => ({ value: item.id, label: item.label }))}
              />
            </Form.Item>

            <Form.Item
              name="pacienteId"
              label="Paciente"
              rules={[{ required: true, message: 'Selecione o paciente.' }]}
            >
              <Select
                disabled={isPaciente}
                options={pacienteOptions}
                placeholder="Selecione o paciente"
              />
            </Form.Item>

            <Form.Item name="dataConsulta" label="Data da consulta (opcional)">
              <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item name="queixaPrincipal" label="Queixa principal">
              <Input.TextArea rows={2} maxLength={500} />
            </Form.Item>
            <Form.Item name="historiaDoencaAtual" label="História da doença atual">
              <Input.TextArea rows={3} maxLength={2000} />
            </Form.Item>
            <Form.Item name="diagnostico" label="Diagnóstico">
              <Input.TextArea rows={3} maxLength={2000} />
            </Form.Item>
            <Form.Item name="prescricao" label="Prescrição">
              <Input.TextArea rows={3} maxLength={2000} />
            </Form.Item>
            <Form.Item name="observacoes" label="Observações">
              <Input.TextArea rows={3} maxLength={2000} />
            </Form.Item>

            <Space>
              <Button onClick={closeCreateModal}>Cancelar</Button>
              <Button type="primary" htmlType="submit" loading={savingCreate}>
                Salvar consulta
              </Button>
            </Space>
          </Form>
        )}
      </Modal>
      <Modal
        title={isAdminOrAtendente ? 'Editar Consulta' : 'Registrar Atendimento'}
        open={openEditModal}
        onCancel={closeEditConsultaModal}
        footer={null}
        destroyOnClose
        width={720}
      >
        <Form<ConsultaCreateFormValues> layout="vertical" form={createForm} onFinish={handleEditConsulta}>
          <Form.Item name="medicoId" label="Médico" rules={[{ required: true, message: 'Selecione o médico.' }]}>
            <Select
              disabled={!isAdminOrAtendente}
              options={medicos.map((item) => ({ value: Number(item.id), label: item.nome }))}
            />
          </Form.Item>
          <Form.Item
            name="agendamentoId"
            label="Agendamento"
            rules={[{ required: true, message: 'Selecione o agendamento.' }]}
          >
            <Select
              disabled={!isAdminOrAtendente}
              options={agendamentos.map((item) => ({ value: item.id, label: item.label }))}
            />
          </Form.Item>
          <Form.Item name="pacienteId" label="Paciente" rules={[{ required: true, message: 'Selecione o paciente.' }]}>
            <Select
              disabled={!isAdminOrAtendente}
              options={pacientes.map((item) => ({ value: Number(item.id), label: item.nome }))}
            />
          </Form.Item>
          <Form.Item name="dataConsulta" label="Data da consulta">
            <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} disabled={!isAdminOrAtendente} />
          </Form.Item>
          <Form.Item name="historiaDoencaAtual" label="História da doença atual">
            <Input.TextArea rows={3} maxLength={2000} />
          </Form.Item>
          <Form.Item name="diagnostico" label="Diagnóstico">
            <Input.TextArea rows={3} maxLength={2000} />
          </Form.Item>
          <Form.Item name="prescricao" label="Prescrição">
            <Input.TextArea rows={3} maxLength={2000} />
          </Form.Item>
          <Form.Item name="observacoes" label="Observações">
            <Input.TextArea rows={3} maxLength={2000} />
          </Form.Item>
          <Space>
            <Button onClick={closeEditConsultaModal}>Cancelar</Button>
            <Button type="primary" htmlType="submit" loading={savingCreate}>
              Salvar
            </Button>
          </Space>
        </Form>
      </Modal>
    </Card>
  )
}

export default ConsultaCalendarPage

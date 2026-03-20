import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import type { AxiosError } from 'axios'
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { agendaMedicoService } from '../../services/agendaMedicoService'
import { especialidadeService } from '../../services/especialidadeService'
import { horarioAgendaService } from '../../services/horarioAgendaService'
import { tipoUsuarioService } from '../../services/tipoUsuarioService'
import { userService } from '../../services/userService'
import type {
  AgendaMedicoDTO,
  AgendaMedicoPayload,
  EspecialidadeDTO,
  HorarioAgendaDTO,
  HorarioAgendaPayload,
} from '../../types/resources'
import type { UsuarioDTO } from '../../types/user'
import './AgendaMedicoPage.css'

interface AgendaFormValues {
  medicoId?: number
  especialidadeId?: number
  dataAgenda?: dayjs.Dayjs
  statusAgenda?: string
}

interface HorarioFormValues {
  medicoId?: number
  agendaId?: number
  horaInicio?: string
  horaFim?: string
  statusHorario?: string
}

interface ApiErrorBody {
  message?: string
  error?: string
  errors?: Record<string, string[] | string>
}

const AGENDA_STATUS_OPTIONS = ['ATIVA', 'INATIVA', 'CANCELADA']
const HORARIO_STATUS_OPTIONS = ['DISPONIVEL', 'INDISPONIVEL', 'RESERVADO']

const getErrorText = (value: unknown): string | null => {
  if (typeof value === 'string' && value.trim()) {
    return value.trim()
  }
  return null
}

const parseApiError = (error: unknown): {
  status?: number
  message: string
  fieldErrors: Record<string, string>
} => {
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

  const bodyMessage = getErrorText(body?.message) ?? getErrorText(body?.error)

  if (status === 403) {
    return {
      status,
      message: bodyMessage ?? 'Acesso negado para executar esta ação.',
      fieldErrors,
    }
  }

  if (status === 400) {
    return {
      status,
      message: bodyMessage ?? 'Regra de negócio inválida. Revise os dados informados.',
      fieldErrors,
    }
  }

  if (status === 422) {
    return {
      status,
      message: bodyMessage ?? 'Existem campos inválidos. Revise o formulário.',
      fieldErrors,
    }
  }

  if (status === 500) {
    return {
      status,
      message: 'Erro interno do servidor. Tente novamente.',
      fieldErrors,
    }
  }

  return {
    status,
    message: bodyMessage ?? 'Não foi possível concluir a operação.',
    fieldErrors,
  }
}

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

const getAgendaDate = (agenda: AgendaMedicoDTO): string => {
  const text = toString(agenda.dataAgenda).trim()
  if (!text) {
    return ''
  }
  return text.slice(0, 10)
}

const AgendaMedicoPage = () => {
  const [agendas, setAgendas] = useState<AgendaMedicoDTO[]>([])
  const [horarios, setHorarios] = useState<HorarioAgendaDTO[]>([])
  const [medicos, setMedicos] = useState<UsuarioDTO[]>([])
  const [especialidades, setEspecialidades] = useState<EspecialidadeDTO[]>([])

  const [loadingMain, setLoadingMain] = useState(true)
  const [savingAgenda, setSavingAgenda] = useState(false)
  const [savingHorario, setSavingHorario] = useState(false)
  const [deletingAgendaId, setDeletingAgendaId] = useState<number | null>(null)
  const [deletingHorarioId, setDeletingHorarioId] = useState<number | null>(null)
  const [loadingHorarios, setLoadingHorarios] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [agendaModalOpen, setAgendaModalOpen] = useState(false)
  const [agendaHorariosModalOpen, setAgendaHorariosModalOpen] = useState(false)
  const [horarioModalOpen, setHorarioModalOpen] = useState(false)
  const [editingAgenda, setEditingAgenda] = useState<AgendaMedicoDTO | null>(null)
  const [editingHorario, setEditingHorario] = useState<HorarioAgendaDTO | null>(null)
  const [selectedAgendaId, setSelectedAgendaId] = useState<number | null>(null)

  const [agendaFilterMedicoId, setAgendaFilterMedicoId] = useState<number | null>(null)
  const [agendaFilterMonth, setAgendaFilterMonth] = useState<number | null>(null)
  const [agendaFilterStatus, setAgendaFilterStatus] = useState<string>('')

  const [agendaForm] = Form.useForm<AgendaFormValues>()
  const [horarioForm] = Form.useForm<HorarioFormValues>()

  const loadMainData = async () => {
    setLoadingMain(true)
    setError(null)

    try {
      const [agendasData, usuariosData, especialidadesData, tiposUsuarioData] = await Promise.all([
        agendaMedicoService.list(),
        userService.list(),
        especialidadeService.list(),
        tipoUsuarioService.list(),
      ])

      const medicoTipoIds = new Set(
        tiposUsuarioData
          .filter((tipo) => normalizeText(tipo.nome).includes('MEDIC'))
          .map((tipo) => tipo.id)
      )

      setAgendas(agendasData)
      setMedicos(
        usuariosData.filter((user) => {
          const tipoById = user.tipoUsuarioId ? medicoTipoIds.has(user.tipoUsuarioId) : false
          const tipoByName = normalizeText(user.tipoUsuarioNome ?? user.tipoUsuario).includes('MEDIC')
          const roleByName = normalizeText((user as unknown as Record<string, unknown>).role).includes(
            'MEDIC'
          )
          return tipoById || tipoByName || roleByName
        })
      )
      setEspecialidades(especialidadesData)
    } catch (requestError) {
      const parsed = parseApiError(requestError)
      setError(parsed.message || 'Não foi possível carregar os dados da agenda médica.')
    } finally {
      setLoadingMain(false)
    }
  }

  const loadHorarios = async () => {
    setLoadingHorarios(true)

    try {
      const data = await horarioAgendaService.list()
      setHorarios(data)
    } catch {
      message.error('Não foi possível carregar os horários.')
    } finally {
      setLoadingHorarios(false)
    }
  }

  useEffect(() => {
    void loadMainData()
    void loadHorarios()
  }, [])

  const medicosOptions = useMemo(
    () =>
      medicos.map((medico) => ({
        value: medico.id,
        label: medico.nome,
      })),
    [medicos]
  )

  const especialidadesOptions = useMemo(
    () =>
      especialidades.map((especialidade) => ({
        value: toNumber(especialidade.id) ?? 0,
        label: toString(especialidade.nomeEspecialidade) || `Especialidade #${especialidade.id ?? '-'}`,
      })),
    [especialidades]
  )

  const agendasFiltradas = useMemo(() => {
    if (!agendaFilterMedicoId) {
      return []
    }

    return agendas.filter((agenda) => {
      const agendaMedicoId = toNumber(agenda.medicoId)
      const agendaData = getAgendaDate(agenda)
      const agendaMonth = agendaData ? dayjs(agendaData).month() + 1 : null
      const agendaStatus = toString(agenda.statusAgenda).toUpperCase()

      if (agendaMedicoId !== agendaFilterMedicoId) {
        return false
      }
      if (agendaFilterMonth && agendaMonth !== agendaFilterMonth) {
        return false
      }
      if (agendaFilterStatus && agendaStatus !== agendaFilterStatus) {
        return false
      }
      return true
    })
  }, [agendas, agendaFilterMedicoId, agendaFilterMonth, agendaFilterStatus])

  const horariosDaAgendaSelecionada = useMemo(() => {
    if (!selectedAgendaId) {
      return []
    }
    return horarios.filter((horario) => toNumber(horario.agendaId) === selectedAgendaId)
  }, [horarios, selectedAgendaId])

  const getMedicoNome = (medicoId: number): string => {
    const medico = medicos.find((item) => item.id === medicoId)
    return medico?.nome ?? `Médico #${medicoId}`
  }

  const getEspecialidadeNome = (especialidadeId: number): string => {
    const especialidade = especialidades.find((item) => toNumber(item.id) === especialidadeId)
    return toString(especialidade?.nomeEspecialidade) || `Especialidade #${especialidadeId}`
  }

  const openCreateAgendaModal = () => {
    setEditingAgenda(null)
    agendaForm.resetFields()
    agendaForm.setFieldValue('statusAgenda', 'ATIVA')
    setAgendaModalOpen(true)
  }

  const openEditAgendaModal = (agenda: AgendaMedicoDTO) => {
    setEditingAgenda(agenda)
    agendaForm.setFieldsValue({
      medicoId: toNumber(agenda.medicoId) ?? undefined,
      especialidadeId: toNumber(agenda.especialidadeId) ?? undefined,
      dataAgenda: getAgendaDate(agenda) ? dayjs(getAgendaDate(agenda), 'YYYY-MM-DD') : undefined,
      statusAgenda: toString(agenda.statusAgenda) || undefined,
    })
    setAgendaModalOpen(true)
  }

  const closeAgendaModal = () => {
    setAgendaModalOpen(false)
    setEditingAgenda(null)
    agendaForm.resetFields()
  }

  const openAgendaHorariosModal = (agenda: AgendaMedicoDTO) => {
    if (!agenda.id) {
      message.error('Agenda inválida para visualizar horários.')
      return
    }
    setSelectedAgendaId(agenda.id)
    setAgendaHorariosModalOpen(true)
  }

  const applyFieldErrorsOnAgendaForm = (fieldErrors: Record<string, string>) => {
    const mapping: Record<string, keyof AgendaFormValues> = {
      medicoId: 'medicoId',
      especialidadeId: 'especialidadeId',
      dataAgenda: 'dataAgenda',
      statusAgenda: 'statusAgenda',
    }

    const fields = Object.entries(fieldErrors)
      .map(([field, messageText]) => {
        const target = mapping[field]
        if (!target) {
          return null
        }
        return { name: target, errors: [messageText] }
      })
      .filter((item): item is { name: keyof AgendaFormValues; errors: string[] } => item !== null)

    if (fields.length > 0) {
      agendaForm.setFields(fields)
    }
  }

  const applyFieldErrorsOnHorarioForm = (fieldErrors: Record<string, string>) => {
    const mapping: Record<string, keyof HorarioFormValues> = {
      medicoId: 'medicoId',
      agendaId: 'agendaId',
      horaInicio: 'horaInicio',
      horaFim: 'horaFim',
      statusHorario: 'statusHorario',
    }

    const fields = Object.entries(fieldErrors)
      .map(([field, messageText]) => {
        const target = mapping[field]
        if (!target) {
          return null
        }
        return { name: target, errors: [messageText] }
      })
      .filter((item): item is { name: keyof HorarioFormValues; errors: string[] } => item !== null)

    if (fields.length > 0) {
      horarioForm.setFields(fields)
    }
  }

  const handleSubmitAgenda = async (values: AgendaFormValues) => {
    if (!values.medicoId || !values.especialidadeId || !values.dataAgenda) {
      return
    }

    const payload: AgendaMedicoPayload = {
      medicoId: values.medicoId,
      especialidadeId: values.especialidadeId,
      dataAgenda: values.dataAgenda.format('YYYY-MM-DD'),
      statusAgenda: values.statusAgenda,
    }

    try {
      setSavingAgenda(true)

      if (editingAgenda?.id) {
        await agendaMedicoService.update(editingAgenda.id, payload)
        message.success('Agenda atualizada com sucesso!')
      } else {
        const created = await agendaMedicoService.create(payload)
        message.success('Agenda criada com sucesso!')
        if (created.id) {
          setSelectedAgendaId(created.id)
        }
      }

      closeAgendaModal()
      await loadMainData()
      await loadHorarios()
    } catch (requestError) {
      const parsed = parseApiError(requestError)
      if (parsed.status === 422) {
        applyFieldErrorsOnAgendaForm(parsed.fieldErrors)
      }
      message.error(parsed.message)
    } finally {
      setSavingAgenda(false)
    }
  }

  const handleDeleteAgenda = (agenda: AgendaMedicoDTO) => {
    Modal.confirm({
      title: 'Excluir agenda',
      content: 'Deseja realmente excluir esta agenda? Esta ação não poderá ser desfeita.',
      okText: 'Excluir',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        if (!agenda.id) {
          message.error('Agenda inválida para exclusão.')
          return
        }

        try {
          setDeletingAgendaId(agenda.id)
          await agendaMedicoService.remove(agenda.id)
          message.success('Agenda excluída com sucesso!')
          if (selectedAgendaId === agenda.id) {
            setSelectedAgendaId(null)
          }
          await loadMainData()
          await loadHorarios()
        } catch (requestError) {
          const parsed = parseApiError(requestError)
          message.error(parsed.message)
        } finally {
          setDeletingAgendaId(null)
        }
      },
    })
  }

  const openCreateHorarioModal = () => {
    setEditingHorario(null)
    horarioForm.resetFields()
    const selectedAgenda =
      selectedAgendaId !== null
        ? agendas.find((agenda) => toNumber(agenda.id) === selectedAgendaId)
        : null
    horarioForm.setFieldsValue({
      medicoId: selectedAgenda ? (toNumber(selectedAgenda.medicoId) ?? undefined) : undefined,
      agendaId: selectedAgendaId ?? undefined,
      statusHorario: 'DISPONIVEL',
    })
    setHorarioModalOpen(true)
  }

  const openEditHorarioModal = (horario: HorarioAgendaDTO) => {
    const horarioAgenda = agendas.find((agenda) => toNumber(agenda.id) === toNumber(horario.agendaId))
    setEditingHorario(horario)
    horarioForm.setFieldsValue({
      medicoId: horarioAgenda ? (toNumber(horarioAgenda.medicoId) ?? undefined) : undefined,
      agendaId: toNumber(horario.agendaId) ?? selectedAgendaId ?? undefined,
      horaInicio: toString(horario.horaInicio).slice(0, 5),
      horaFim: toString(horario.horaFim).slice(0, 5),
      statusHorario: toString(horario.statusHorario) || undefined,
    })
    setHorarioModalOpen(true)
  }

  const closeHorarioModal = () => {
    setHorarioModalOpen(false)
    setEditingHorario(null)
    horarioForm.resetFields()
  }

  const closeAgendaHorariosModal = () => {
    setAgendaHorariosModalOpen(false)
  }

  const handleSubmitHorario = async (values: HorarioFormValues) => {
    if (!values.medicoId || !values.agendaId || !values.horaInicio || !values.horaFim) {
      return
    }

    if (values.horaFim <= values.horaInicio) {
      horarioForm.setFields([
        {
          name: 'horaFim',
          errors: ['A hora final deve ser maior que a hora inicial.'],
        },
      ])
      return
    }

    const payload: HorarioAgendaPayload = {
      agendaId: values.agendaId,
      horaInicio: `${values.horaInicio}:00`,
      horaFim: `${values.horaFim}:00`,
      statusHorario: values.statusHorario,
    }

    try {
      setSavingHorario(true)

      if (editingHorario?.id) {
        await horarioAgendaService.update(editingHorario.id, payload)
        message.success('Horário atualizado com sucesso!')
      } else {
        await horarioAgendaService.create(payload)
        message.success('Horário cadastrado com sucesso!')
      }

      closeHorarioModal()
      await loadHorarios()
    } catch (requestError) {
      const parsed = parseApiError(requestError)
      if (parsed.status === 422) {
        applyFieldErrorsOnHorarioForm(parsed.fieldErrors)
      }
      if (parsed.message.includes('A hora final deve ser maior que a hora inicial')) {
        horarioForm.setFields([
          {
            name: 'horaFim',
            errors: ['A hora final deve ser maior que a hora inicial.'],
          },
        ])
      }
      message.error(parsed.message)
    } finally {
      setSavingHorario(false)
    }
  }

  const handleDeleteHorario = (horario: HorarioAgendaDTO) => {
    Modal.confirm({
      title: 'Excluir horário',
      content: 'Deseja realmente excluir este horário?',
      okText: 'Excluir',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        if (!horario.id) {
          message.error('Horário inválido para exclusão.')
          return
        }

        try {
          setDeletingHorarioId(horario.id)
          await horarioAgendaService.remove(horario.id)
          message.success('Horário excluído com sucesso!')
          await loadHorarios()
        } catch (requestError) {
          const parsed = parseApiError(requestError)
          message.error(parsed.message)
        } finally {
          setDeletingHorarioId(null)
        }
      },
    })
  }

  const agendaColumns: ColumnsType<AgendaMedicoDTO> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (value: number | undefined) => value ?? '-',
    },
    {
      title: 'Médico',
      key: 'medico',
      render: (_, record) => getMedicoNome(toNumber(record.medicoId) ?? 0),
    },
    {
      title: 'Especialidade',
      key: 'especialidade',
      render: (_, record) => getEspecialidadeNome(toNumber(record.especialidadeId) ?? 0),
    },
    {
      title: 'Data',
      key: 'dataAgenda',
      render: (_, record) => {
        const date = getAgendaDate(record)
        return date ? dayjs(date).format('DD/MM/YYYY') : '-'
      },
    },
    {
      title: 'Status',
      key: 'statusAgenda',
      render: (_, record) => {
        const status = toString(record.statusAgenda) || 'SEM STATUS'
        return <Tag color={status === 'ATIVA' ? 'green' : 'default'}>{status}</Tag>
      },
    },
    {
      title: 'Ações',
      key: 'acoes',
      width: 180,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            onClick={() => openAgendaHorariosModal(record)}
          >
            Ver horários
          </Button>
          <Button type="text" icon={<EditOutlined />} onClick={() => openEditAgendaModal(record)} />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            loading={deletingAgendaId === record.id}
            onClick={() => handleDeleteAgenda(record)}
          />
        </Space>
      ),
    },
  ]

  const horarioColumns: ColumnsType<HorarioAgendaDTO> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (value: number | undefined) => value ?? '-',
    },
    {
      title: 'Início',
      key: 'horaInicio',
      render: (_, record) => toString(record.horaInicio).slice(0, 5),
    },
    {
      title: 'Fim',
      key: 'horaFim',
      render: (_, record) => toString(record.horaFim).slice(0, 5),
    },
    {
      title: 'Status',
      key: 'statusHorario',
      render: (_, record) => {
        const status = toString(record.statusHorario) || 'SEM STATUS'
        return <Tag color={status === 'DISPONIVEL' ? 'green' : 'default'}>{status}</Tag>
      },
    },
    {
      title: 'Ações',
      key: 'acoes',
      width: 110,
      render: (_, record) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => openEditHorarioModal(record)} />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            loading={deletingHorarioId === record.id}
            onClick={() => handleDeleteHorario(record)}
          />
        </Space>
      ),
    },
  ]

  const watchedAgendaMedicoId = Form.useWatch('medicoId', agendaForm)
  const watchedAgendaEspecialidadeId = Form.useWatch('especialidadeId', agendaForm)
  const watchedAgendaData = Form.useWatch('dataAgenda', agendaForm)
  const isAgendaFormInvalid =
    !watchedAgendaMedicoId || !watchedAgendaEspecialidadeId || !watchedAgendaData

  const watchedHorarioAgendaId = Form.useWatch('agendaId', horarioForm)
  const watchedHorarioMedicoId = Form.useWatch('medicoId', horarioForm)
  const watchedHorarioInicio = Form.useWatch('horaInicio', horarioForm)
  const watchedHorarioFim = Form.useWatch('horaFim', horarioForm)
  const isHorarioFormInvalid =
    !watchedHorarioMedicoId || !watchedHorarioAgendaId || !watchedHorarioInicio || !watchedHorarioFim

  const agendasDoMedicoSelecionado = useMemo(() => {
    if (!watchedHorarioMedicoId) {
      return []
    }

    return agendas
      .filter((agenda) => toNumber(agenda.medicoId) === watchedHorarioMedicoId)
      .map((agenda) => ({
        value: toNumber(agenda.id) ?? 0,
        label: `Agenda #${agenda.id} - ${getAgendaDate(agenda) ? dayjs(getAgendaDate(agenda)).format('DD/MM/YYYY') : 'Sem data'}`,
      }))
      .filter((option) => option.value > 0)
  }, [agendas, watchedHorarioMedicoId])

  const monthOptions = useMemo(
    () => [
      { value: 1, label: 'Janeiro' },
      { value: 2, label: 'Fevereiro' },
      { value: 3, label: 'Março' },
      { value: 4, label: 'Abril' },
      { value: 5, label: 'Maio' },
      { value: 6, label: 'Junho' },
      { value: 7, label: 'Julho' },
      { value: 8, label: 'Agosto' },
      { value: 9, label: 'Setembro' },
      { value: 10, label: 'Outubro' },
      { value: 11, label: 'Novembro' },
      { value: 12, label: 'Dezembro' },
    ],
    []
  )

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {error && (
        <Alert
          type="error"
          showIcon
          message="Erro ao carregar agenda médica"
          description={error}
          action={
            <Button size="small" onClick={() => void loadMainData()}>
              Tentar novamente
            </Button>
          }
        />
      )}

      <Row gutter={16}>
        <Col xs={24}>
          <Card
            className="agenda-card"
            title="Cadastro e listagem de agenda médica"
            extra={
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreateAgendaModal}>
                Nova agenda
              </Button>
            }
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Row gutter={8}>
                <Col xs={24} md={8}>
                  <Select
                    allowClear
                    placeholder="Filtrar por médico"
                    options={medicosOptions.filter((option) => option.value)}
                    value={agendaFilterMedicoId ?? undefined}
                    onChange={(value) => setAgendaFilterMedicoId(value ?? null)}
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col xs={24} md={8}>
                  <Select
                    allowClear
                    placeholder="Filtrar por mês"
                    value={agendaFilterMonth ?? undefined}
                    onChange={(value) => setAgendaFilterMonth(value ?? null)}
                    options={monthOptions}
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col xs={24} md={8}>
                  <Select
                    allowClear
                    placeholder="Filtrar por status"
                    value={agendaFilterStatus || undefined}
                    options={AGENDA_STATUS_OPTIONS.map((item) => ({ value: item, label: item }))}
                    onChange={(value) => setAgendaFilterStatus(value ?? '')}
                    style={{ width: '100%' }}
                  />
                </Col>
              </Row>

              {loadingMain ? (
                <Spin />
              ) : (
                <>
                  {!agendaFilterMedicoId && (
                    <Alert
                      type="info"
                      showIcon
                      message="Selecione um médico para carregar as agendas."
                    />
                  )}

                  <Table<AgendaMedicoDTO>
                    rowKey={(record) => record.id ?? `${record.medicoId}-${record.dataAgenda}`}
                    columns={agendaColumns}
                    dataSource={agendasFiltradas}
                    pagination={{ pageSize: 8, showTotal: (total) => `${total} agendas` }}
                    locale={{
                      emptyText: agendaFilterMedicoId ? (
                        <Empty description="Nenhuma agenda encontrada" />
                      ) : (
                        <Empty description="Selecione um médico para iniciar a busca" />
                      ),
                    }}
                  />
                </>
              )}
            </Space>
          </Card>
        </Col>

      </Row>

      <Modal
        title={`Horários da agenda #${selectedAgendaId ?? '-'}`}
        open={agendaHorariosModalOpen}
        onCancel={closeAgendaHorariosModal}
        footer={null}
        width={900}
        destroyOnClose
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateHorarioModal}>
            Novo horário
          </Button>
          {loadingHorarios ? (
            <Spin />
          ) : (
            <Table<HorarioAgendaDTO>
              rowKey={(record) => record.id ?? `${record.agendaId}-${record.horaInicio}-${record.horaFim}`}
              columns={horarioColumns}
              dataSource={horariosDaAgendaSelecionada}
              pagination={{ pageSize: 8, showTotal: (total) => `${total} horários` }}
              locale={{ emptyText: <Empty description="Nenhum horário cadastrado para esta agenda" /> }}
            />
          )}
        </Space>
      </Modal>

      <Modal
        title={editingAgenda ? 'Editar agenda' : 'Cadastrar agenda'}
        open={agendaModalOpen}
        onCancel={closeAgendaModal}
        footer={null}
        destroyOnClose
      >
        <Form<AgendaFormValues> layout="vertical" form={agendaForm} onFinish={handleSubmitAgenda}>
          <Form.Item name="medicoId" label="Médico" rules={[{ required: true, message: 'Informe o médico.' }]}>
            <Select placeholder="Selecione o médico" options={medicosOptions.filter((option) => option.value)} />
          </Form.Item>

          <Form.Item
            name="especialidadeId"
            label="Especialidade"
            rules={[{ required: true, message: 'Informe a especialidade.' }]}
          >
            <Select placeholder="Selecione a especialidade" options={especialidadesOptions} />
          </Form.Item>

          <Form.Item
            name="dataAgenda"
            label="Data da agenda"
            rules={[{ required: true, message: 'Informe a data da agenda.' }]}
          >
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>

          <Form.Item name="statusAgenda" label="Status da agenda">
            <Select
              allowClear
              placeholder="Selecione o status"
              options={AGENDA_STATUS_OPTIONS.map((item) => ({ value: item, label: item }))}
            />
          </Form.Item>

          <Space>
            <Button onClick={closeAgendaModal}>Cancelar</Button>
            <Button type="primary" htmlType="submit" loading={savingAgenda} disabled={isAgendaFormInvalid}>
              Salvar
            </Button>
          </Space>
        </Form>
      </Modal>

      <Modal
        title={editingHorario ? 'Editar horário' : 'Cadastrar horário'}
        open={horarioModalOpen}
        onCancel={closeHorarioModal}
        footer={null}
        destroyOnClose
      >
        <Form<HorarioFormValues> layout="vertical" form={horarioForm} onFinish={handleSubmitHorario}>
          <Form.Item
            name="medicoId"
            label="Médico"
            rules={[{ required: true, message: 'Informe o médico.' }]}
          >
            <Select
              placeholder="Selecione o médico"
              options={medicosOptions.filter((option) => option.value)}
              onChange={() => {
                horarioForm.setFieldValue('agendaId', undefined)
              }}
            />
          </Form.Item>

          <Form.Item
            name="agendaId"
            label="Agenda"
            rules={[{ required: true, message: 'Informe a agenda.' }]}
          >
            <Select
              placeholder={watchedHorarioMedicoId ? 'Selecione a agenda' : 'Escolha o médico primeiro'}
              disabled={!watchedHorarioMedicoId}
              options={agendasDoMedicoSelecionado}
            />
          </Form.Item>

          <Form.Item
            name="horaInicio"
            label="Hora início"
            rules={[{ required: true, message: 'Informe a hora de início.' }]}
          >
            <Input type="time" />
          </Form.Item>

          <Form.Item
            name="horaFim"
            label="Hora fim"
            rules={[
              { required: true, message: 'Informe a hora final.' },
              {
                validator: async (_, value: string) => {
                  const inicio = horarioForm.getFieldValue('horaInicio')
                  if (value && inicio && value <= inicio) {
                    throw new Error('A hora final deve ser maior que a hora inicial.')
                  }
                },
              },
            ]}
          >
            <Input type="time" />
          </Form.Item>

          <Form.Item name="statusHorario" label="Status do horário">
            <Select
              allowClear
              placeholder="Selecione o status"
              options={HORARIO_STATUS_OPTIONS.map((item) => ({ value: item, label: item }))}
            />
          </Form.Item>

          <Space>
            <Button onClick={closeHorarioModal}>Cancelar</Button>
            <Button type="primary" htmlType="submit" loading={savingHorario} disabled={isHorarioFormInvalid}>
              Salvar
            </Button>
          </Space>
        </Form>
      </Modal>
    </Space>
  )
}

export default AgendaMedicoPage

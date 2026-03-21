import { CalendarOutlined } from '@ant-design/icons'
import type { CalendarProps } from 'antd'
import {
  Alert,
  Badge,
  Button,
  Calendar,
  Card,
  Form,
  Input,
  List,
  Modal,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { consultaService } from '../../services/consultaService'
import type { ConsultaDTO } from '../../types/resources'
import {
  getConsultaDataIso,
  getConsultaId,
  getEspecialidadeNomeConsulta,
  getHorarioLabel,
  getPacienteNomeConsulta,
  getStatusConsultaLabel,
  isConsultaFinalizada,
} from '../../utils/consultaDisplay'
import './ConsultasCalendarioPage.css'

interface DetalhesFormValues {
  queixaPrincipal?: string
  historiaDoencaAtual?: string
  diagnostico?: string
  prescricao?: string
  observacoes?: string
}

const ConsultasMedicoCalendarioPage = () => {
  const [consultas, setConsultas] = useState<ConsultaDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [calendarValue, setCalendarValue] = useState<Dayjs>(() => dayjs())
  const [modalDia, setModalDia] = useState<Dayjs | null>(null)
  const [detalheConsulta, setDetalheConsulta] = useState<ConsultaDTO | null>(null)
  const [finalizando, setFinalizando] = useState(false)
  const [form] = Form.useForm<DetalhesFormValues>()

  const loadConsultas = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await consultaService.listMinhasMedico()
      setConsultas(data)
    } catch {
      setError('Não foi possível carregar suas consultas.')
      setConsultas([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadConsultas()
  }, [loadConsultas])

  const consultasPorDia = useMemo(() => {
    const map = new Map<string, ConsultaDTO[]>()
    consultas.forEach((c) => {
      const key = getConsultaDataIso(c)
      if (!key) {
        return
      }
      const arr = map.get(key) ?? []
      arr.push(c)
      map.set(key, arr)
    })
    return map
  }, [consultas])

  useEffect(() => {
    if (!modalDia) {
      return
    }
    const key = modalDia.format('YYYY-MM-DD')
    if ((consultasPorDia.get(key)?.length ?? 0) === 0) {
      setModalDia(null)
    }
  }, [consultasPorDia, modalDia])

  const abrirDetalhesDoDia = (d: Dayjs) => {
    const key = d.format('YYYY-MM-DD')
    const lista = consultasPorDia.get(key) ?? []
    if (lista.length === 0) {
      message.info('Nenhuma consulta neste dia.')
      return
    }
    setCalendarValue(d)
    setModalDia(d)
  }

  const cellRender: CalendarProps<Dayjs>['cellRender'] = (date, info) => {
    if (info.type !== 'date') {
      return null
    }
    const key = date.format('YYYY-MM-DD')
    const n = consultasPorDia.get(key)?.length ?? 0
    if (n === 0) {
      return null
    }
    return (
      <div
        className="consultas-cal-badge-wrap"
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          abrirDetalhesDoDia(date)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            e.stopPropagation()
            abrirDetalhesDoDia(date)
          }
        }}
      >
        <Badge count={n} size="small" color="blue" />
      </div>
    )
  }

  const abrirModalDetalhe = (c: ConsultaDTO) => {
    setDetalheConsulta(c)
    form.setFieldsValue({
      queixaPrincipal: c.queixaPrincipal ?? '',
      historiaDoencaAtual: c.historiaDoencaAtual ?? '',
      diagnostico: c.diagnostico ?? '',
      prescricao: c.prescricao ?? '',
      observacoes: c.observacoes ?? '',
    })
  }

  const fecharModalDetalhe = () => {
    setDetalheConsulta(null)
    form.resetFields()
  }

  const montarPayloadFinalizar = (values: DetalhesFormValues) => {
    const trim = (s: string | undefined) => (typeof s === 'string' ? s.trim() : '')
    const out: Record<string, string> = {}
    const map: [keyof DetalhesFormValues, string][] = [
      ['queixaPrincipal', 'queixaPrincipal'],
      ['historiaDoencaAtual', 'historiaDoencaAtual'],
      ['diagnostico', 'diagnostico'],
      ['prescricao', 'prescricao'],
      ['observacoes', 'observacoes'],
    ]
    map.forEach(([formKey, apiKey]) => {
      const t = trim(values[formKey])
      if (t) {
        out[apiKey] = t
      }
    })
    return out
  }

  const finalizarConsulta = async () => {
    const c = detalheConsulta
    const id = c ? getConsultaId(c) : null
    if (!c || id == null) {
      message.error('Consulta inválida.')
      return
    }
    if (isConsultaFinalizada(c)) {
      message.info('Esta consulta já está finalizada.')
      return
    }
    let values: DetalhesFormValues
    try {
      values = await form.validateFields()
    } catch {
      return
    }
    setFinalizando(true)
    try {
      const payload = montarPayloadFinalizar(values)
      await consultaService.finalizarComoMedico(id, payload)
      message.success('Consulta finalizada.')
      fecharModalDetalhe()
      await loadConsultas()
    } catch {
      /* interceptor / mensagens globais */
    } finally {
      setFinalizando(false)
    }
  }

  const listaModal = modalDia ? consultasPorDia.get(modalDia.format('YYYY-MM-DD')) ?? [] : []

  const detalheFinalizada = detalheConsulta ? isConsultaFinalizada(detalheConsulta) : false

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Space align="center">
        <CalendarOutlined style={{ fontSize: 22 }} />
        <Typography.Title level={4} style={{ margin: 0 }}>
          Minhas consultas
        </Typography.Title>
      </Space>

      <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
        Toque em um dia com indicação para ver as consultas. Abra os detalhes para registrar o prontuário e
        finalizar o atendimento.
      </Typography.Paragraph>

      {error && <Alert type="error" message={error} showIcon />}

      <Card>
        <Spin spinning={loading}>
          <div className="consultas-cal-wrap">
            <Calendar
              value={calendarValue}
              onChange={(d) => setCalendarValue(d)}
              onSelect={(d) => {
                setCalendarValue(d)
                abrirDetalhesDoDia(d)
              }}
              cellRender={cellRender}
              fullscreen
            />
          </div>
        </Spin>
      </Card>

      <Modal
        title={modalDia ? `Consultas em ${modalDia.format('DD/MM/YYYY')}` : 'Consultas'}
        open={modalDia != null}
        onCancel={() => setModalDia(null)}
        footer={[
          <Button key="fechar" onClick={() => setModalDia(null)}>
            Fechar
          </Button>,
        ]}
      >
        <List
          dataSource={listaModal}
          locale={{ emptyText: 'Nenhum item.' }}
          renderItem={(item) => {
            const statusLabel = getStatusConsultaLabel(item)
            return (
              <List.Item
                actions={[
                  <Button key="det" type="link" onClick={() => abrirModalDetalhe(item)}>
                    Detalhes
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space wrap>
                      <Typography.Text strong>{getPacienteNomeConsulta(item)}</Typography.Text>
                      <Typography.Text type="secondary">{getEspecialidadeNomeConsulta(item)}</Typography.Text>
                      <Tag color={isConsultaFinalizada(item) ? 'default' : 'processing'}>{statusLabel}</Tag>
                    </Space>
                  }
                  description={
                    <Typography.Text type="secondary">Horário: {getHorarioLabel(item)}</Typography.Text>
                  }
                />
              </List.Item>
            )
          }}
        />
      </Modal>

      <Modal
        title="Detalhes da consulta"
        open={detalheConsulta != null}
        onCancel={fecharModalDetalhe}
        width={640}
        destroyOnClose
        footer={[
          <Button key="cancel" onClick={fecharModalDetalhe}>
            Fechar
          </Button>,
          <Button
            key="done"
            type="primary"
            loading={finalizando}
            disabled={detalheFinalizada}
            onClick={() => void finalizarConsulta()}
          >
            Finalizar consulta
          </Button>,
        ]}
      >
        {detalheConsulta && (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Typography.Text type="secondary">Paciente: </Typography.Text>
              <Typography.Text strong>{getPacienteNomeConsulta(detalheConsulta)}</Typography.Text>
            </div>
            <div>
              <Typography.Text type="secondary">Horário: </Typography.Text>
              <Typography.Text>{getHorarioLabel(detalheConsulta)}</Typography.Text>
            </div>
            <div>
              <Typography.Text type="secondary">Especialidade: </Typography.Text>
              <Typography.Text>{getEspecialidadeNomeConsulta(detalheConsulta)}</Typography.Text>
            </div>
            <div>
              <Typography.Text type="secondary">Status: </Typography.Text>
              <Tag color={detalheFinalizada ? 'default' : 'processing'}>
                {getStatusConsultaLabel(detalheConsulta)}
              </Tag>
            </div>

            <Typography.Text type="secondary">
              Preencha os campos clínicos abaixo e finalize o atendimento. Campos em branco não alteram dados já
              salvos.
            </Typography.Text>

            <Form<DetalhesFormValues> form={form} layout="vertical" disabled={detalheFinalizada}>
              <Form.Item name="queixaPrincipal" label="Queixa principal">
                <Input.TextArea rows={2} placeholder="Opcional" />
              </Form.Item>
              <Form.Item name="historiaDoencaAtual" label="História da doença atual">
                <Input.TextArea rows={3} placeholder="Opcional" />
              </Form.Item>
              <Form.Item name="diagnostico" label="Diagnóstico">
                <Input.TextArea rows={2} placeholder="Opcional" />
              </Form.Item>
              <Form.Item name="prescricao" label="Prescrição">
                <Input.TextArea rows={3} placeholder="Opcional" />
              </Form.Item>
              <Form.Item name="observacoes" label="Observações">
                <Input.TextArea rows={2} placeholder="Opcional" />
              </Form.Item>
            </Form>
          </Space>
        )}
      </Modal>
    </Space>
  )
}

export default ConsultasMedicoCalendarioPage

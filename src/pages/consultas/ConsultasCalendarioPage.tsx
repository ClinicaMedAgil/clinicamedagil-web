import { CalendarOutlined } from '@ant-design/icons'
import type { CalendarProps } from 'antd'
import {
  Alert,
  Badge,
  Button,
  Calendar,
  Card,
  List,
  Modal,
  Popconfirm,
  Space,
  Spin,
  Typography,
  message,
} from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { consultaService } from '../../services/consultaService'
import type { ConsultaDTO } from '../../types/resources'
import {
  getConsultaDataIso,
  getConsultaId,
  getEspecialidadeNomeConsulta,
  getHorarioLabel,
  getMedicoNomeConsulta,
} from '../../utils/consultaDisplay'
import './ConsultasCalendarioPage.css'

const ConsultasCalendarioPage = () => {
  const { roles } = useAuth()
  const [consultas, setConsultas] = useState<ConsultaDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [calendarValue, setCalendarValue] = useState<Dayjs>(() => dayjs())
  const [modalDia, setModalDia] = useState<Dayjs | null>(null)
  const [removendoId, setRemovendoId] = useState<number | null>(null)

  const loadConsultas = useCallback(async () => {
    setLoading(true)
    setError(null)
    const gestao = roles.includes('ADMIN') || roles.includes('ATENDENTE')
    try {
      const data = gestao
        ? await consultaService.listConsultasPacienteGestao()
        : await consultaService.listMinhasPaciente()
      setConsultas(data)
    } catch {
      setError(
        gestao
          ? 'Não foi possível carregar as consultas.'
          : 'Não foi possível carregar suas consultas.'
      )
      setConsultas([])
    } finally {
      setLoading(false)
    }
  }, [roles])

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
      message.info('Nenhuma consulta agendada neste dia.')
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

  const cancelarConsulta = async (c: ConsultaDTO) => {
    const id = getConsultaId(c)
    if (!id) {
      message.error('Consulta inválida para cancelamento.')
      throw new Error('consulta sem id')
    }
    const gestao = roles.includes('ADMIN') || roles.includes('ATENDENTE')
    setRemovendoId(id)
    try {
      if (gestao) {
        await consultaService.removeGestao(id)
      } else {
        await consultaService.removePaciente(id)
      }
      message.success('Consulta desmarcada.')
      await loadConsultas()
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (!status) {
        message.error('Não foi possível desmarcar a consulta. Verifique a conexão e tente novamente.')
      }
      throw err
    } finally {
      setRemovendoId(null)
    }
  }

  const listaModal = modalDia
    ? consultasPorDia.get(modalDia.format('YYYY-MM-DD')) ?? []
    : []

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Space align="center">
        <CalendarOutlined style={{ fontSize: 22 }} />
        <Typography.Title level={4} style={{ margin: 0 }}>
          Minhas consultas
        </Typography.Title>
      </Space>

      <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
        Toque em um dia com indicação para ver os detalhes ou desmarcar a consulta.
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
            const cid = getConsultaId(item)
            return (
              <List.Item>
                <List.Item.Meta
                  title={
                    <Space wrap>
                      <Typography.Text strong>{getMedicoNomeConsulta(item)}</Typography.Text>
                      <Typography.Text type="secondary">
                        {getEspecialidadeNomeConsulta(item)}
                      </Typography.Text>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={4}>
                      <Typography.Text>Horário: {getHorarioLabel(item)}</Typography.Text>
                      {cid != null && (
                        <Popconfirm
                          title="Desmarcar esta consulta?"
                          description="O horário voltará a ficar disponível para outros pacientes."
                          okText="Sim, desmarcar"
                          cancelText="Não"
                          onConfirm={() => cancelarConsulta(item)}
                        >
                          <Button danger size="small" loading={removendoId === cid}>
                            Desmarcar consulta
                          </Button>
                        </Popconfirm>
                      )}
                    </Space>
                  }
                />
              </List.Item>
            )
          }}
        />
      </Modal>
    </Space>
  )
}

export default ConsultasCalendarioPage

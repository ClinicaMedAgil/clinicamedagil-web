import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Empty, Form, Input, Modal, Space, Spin, Table, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo, useState } from 'react'
import { especialidadeService } from '../../services/especialidadeService'
import type { EspecialidadeDTO } from '../../types/resources'
import './EspecialidadeListPage.css'

interface EspecialidadeFormValues {
  nomeEspecialidade: string
  descricao?: string
}

interface EspecialidadeRow {
  id?: number
  nomeEspecialidade: string
  descricao?: string
}

const getEspecialidadeNome = (especialidade: EspecialidadeDTO): string => {
  if (typeof especialidade.nomeEspecialidade === 'string') {
    return especialidade.nomeEspecialidade
  }

  return ''
}

const EspecialidadeListPage = () => {
  const [especialidades, setEspecialidades] = useState<EspecialidadeDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEspecialidade, setEditingEspecialidade] = useState<EspecialidadeRow | null>(null)
  const [form] = Form.useForm<EspecialidadeFormValues>()

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await especialidadeService.list()
      setEspecialidades(data)
    } catch {
      setError('Não foi possível carregar a lista de especialidades.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const rows = useMemo<EspecialidadeRow[]>(
    () =>
      especialidades.map((item) => ({
        id: typeof item.id === 'number' ? item.id : undefined,
        nomeEspecialidade: getEspecialidadeNome(item),
        descricao: typeof item.descricao === 'string' ? item.descricao : '',
      })),
    [especialidades]
  )

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return rows
    }

    return rows.filter((item) => item.nomeEspecialidade.toLowerCase().includes(query))
  }, [rows, search])

  const closeModal = () => {
    setModalOpen(false)
    setEditingEspecialidade(null)
    form.resetFields()
  }

  const openCreateModal = () => {
    setEditingEspecialidade(null)
    form.setFieldsValue({ nomeEspecialidade: '', descricao: '' })
    setModalOpen(true)
  }

  const openEditModal = (record: EspecialidadeRow) => {
    if (!record.id) {
      message.error('Especialidade inválida para edição.')
      return
    }

    setEditingEspecialidade(record)
    form.setFieldsValue({ nomeEspecialidade: record.nomeEspecialidade, descricao: record.descricao ?? '' })
    setModalOpen(true)
  }

  const handleDelete = (record: EspecialidadeRow) => {
    Modal.confirm({
      title: 'Excluir especialidade',
      content: `Deseja realmente excluir "${record.nomeEspecialidade}"? Esta ação não poderá ser desfeita.`,
      okText: 'Excluir',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        if (!record.id) {
          message.error('Especialidade inválida para exclusão.')
          return
        }

        try {
          setDeletingId(record.id)
          await especialidadeService.remove(record.id)
          message.success('Especialidade excluída com sucesso!')
          await loadData()
        } catch {
          message.error('Erro ao excluir especialidade.')
        } finally {
          setDeletingId(null)
        }
      },
    })
  }

  const handleSubmit = async (values: EspecialidadeFormValues) => {
    const nomeEspecialidade = values.nomeEspecialidade.trim()
    const descricao = values.descricao?.trim() ? values.descricao.trim() : null

    try {
      setSaving(true)

      if (editingEspecialidade?.id) {
        await especialidadeService.update(editingEspecialidade.id, { nomeEspecialidade, descricao })
        message.success('Especialidade atualizada com sucesso!')
      } else {
        await especialidadeService.create({ nomeEspecialidade, descricao })
        message.success('Especialidade cadastrada com sucesso!')
      }

      closeModal()
      await loadData()
    } catch {
      message.error('Não foi possível salvar a especialidade.')
    } finally {
      setSaving(false)
    }
  }

  const columns: ColumnsType<EspecialidadeRow> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 90,
      render: (id?: number) => id ?? '-',
    },
    {
      title: 'Nome',
      dataIndex: 'nomeEspecialidade',
      key: 'nomeEspecialidade',
    },
    {
      title: 'Descrição',
      dataIndex: 'descricao',
      key: 'descricao',
      render: (descricao?: string) => descricao || '-',
    },
    {
      title: 'Ações',
      key: 'acoes',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            aria-label="Editar especialidade"
            title="Editar"
            className="especialidades-action-btn edit"
            onClick={() => openEditModal(record)}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            aria-label="Excluir especialidade"
            title="Excluir"
            className="especialidades-action-btn delete"
            loading={deletingId === record.id}
            onClick={() => handleDelete(record)}
          />
        </Space>
      ),
    },
  ]

  return (
    <>
      <Card
        className="especialidades-list-card"
        title="Gestão de Especialidades"
        extra={
          <Button type="primary" className="especialidades-primary-btn" icon={<PlusOutlined />} onClick={openCreateModal}>
            Nova Especialidade
          </Button>
        }
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Input.Search
            placeholder="Buscar por nome"
            allowClear
            onSearch={setSearch}
            onChange={(event) => setSearch(event.target.value)}
            value={search}
          />

          {error && (
            <Alert
              type="error"
              showIcon
              title="Erro ao carregar dados"
              description={error}
              action={
                <Button size="small" onClick={() => void loadData()}>
                  Tentar novamente
                </Button>
              }
            />
          )}

          {loading ? (
            <Spin />
          ) : (
            <Table<EspecialidadeRow>
              className="especialidades-table"
              rowKey={(record) => record.id ?? record.nomeEspecialidade}
              dataSource={filteredRows}
              columns={columns}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `${total} especialidades`,
              }}
              rowClassName={(_, index) => (index % 2 === 0 ? 'especialidades-row-even' : 'especialidades-row-odd')}
              locale={{ emptyText: <Empty description="Nenhuma especialidade encontrada" /> }}
            />
          )}
        </Space>
      </Card>

      <Modal
        title={editingEspecialidade ? 'Editar especialidade' : 'Cadastrar especialidade'}
        open={modalOpen}
        onCancel={closeModal}
        footer={null}
        destroyOnClose
      >
        <Form<EspecialidadeFormValues> form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Nome da especialidade"
            name="nomeEspecialidade"
            rules={[
              { required: true, message: 'Informe o nome da especialidade.' },
              { min: 3, message: 'Informe ao menos 3 caracteres.' },
            ]}
          >
            <Input placeholder="Ex.: Cardiologia" maxLength={120} />
          </Form.Item>
          <Form.Item label="Descrição" name="descricao">
            <Input.TextArea placeholder="Descrição (opcional)" rows={3} maxLength={255} />
          </Form.Item>

          <Space>
            <Button onClick={closeModal}>Cancelar</Button>
            <Button type="primary" htmlType="submit" loading={saving}>
              Salvar
            </Button>
          </Space>
        </Form>
      </Modal>
    </>
  )
}

export default EspecialidadeListPage

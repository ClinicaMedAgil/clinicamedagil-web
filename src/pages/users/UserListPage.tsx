import { Button, Card, Empty, Input, Modal, Space, Spin, Table, Tag, Alert, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { tipoUsuarioService } from '../../services/tipoUsuarioService'
import { userService } from '../../services/userService'
import RoleGate from '../../components/auth/RoleGate'
import type { TipoUsuarioDTO, UsuarioDTO } from '../../types/user'
import { formatCpf, formatPhone, getTipoUsuarioLabel, onlyDigits } from '../../utils/formatters'
import './UserListPage.css'

const UserListPage = () => {
  const navigate = useNavigate()
  const [users, setUsers] = useState<UsuarioDTO[]>([])
  const [tiposUsuario, setTiposUsuario] = useState<TipoUsuarioDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [usuarios, tipos] = await Promise.all([userService.list(), tipoUsuarioService.list()])
      setUsers(usuarios)
      setTiposUsuario(tipos)
    } catch {
      setError('Não foi possível carregar a lista de usuários.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return users
    }

    const digitsQuery = onlyDigits(query)

    return users.filter((user) => {
      const searchFields = [user.nome, user.email, user.cpf].map((value) =>
        (value ?? '').toLowerCase()
      )

      const baseMatch = searchFields.some((field) => field.includes(query))
      const cpfMatch = digitsQuery.length > 0 && onlyDigits(user.cpf).includes(digitsQuery)

      return baseMatch || cpfMatch
    })
  }, [search, users])

  const handleDelete = (user: UsuarioDTO) => {
    Modal.confirm({
      title: 'Excluir usuário',
      content: `Deseja realmente excluir "${user.nome}"? Esta ação não poderá ser desfeita.`,
      okText: 'Excluir',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        if (!user.id) {
          message.error('Usuário inválido para exclusão.')
          return
        }

        try {
          setDeletingId(user.id)
          await userService.remove(user.id)
          message.success('Usuário excluído com sucesso!')
          await loadData()
        } catch {
          message.error('Erro ao excluir usuário.')
        } finally {
          setDeletingId(null)
        }
      },
    })
  }

  const columns: ColumnsType<UsuarioDTO> = [
    { title: 'Nome', dataIndex: 'nome', key: 'nome' },
    {
      title: 'CPF',
      dataIndex: 'cpf',
      key: 'cpf',
      render: (cpf: string) => formatCpf(cpf ?? ''),
    },
    { title: 'E-mail', dataIndex: 'email', key: 'email' },
    {
      title: 'Telefone',
      dataIndex: 'telefone',
      key: 'telefone',
      render: (telefone?: string) => (telefone ? formatPhone(telefone) : '-'),
    },
    {
      title: 'Tipo de Usuário',
      dataIndex: 'tipoUsuarioId',
      key: 'tipoUsuarioId',
      render: (tipoUsuarioId: number) => getTipoUsuarioLabel(tipoUsuarioId, tiposUsuario),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status?: string) =>
        status ? <Tag color={status === 'ATIVO' ? 'green' : 'default'}>{status}</Tag> : '-',
    },
    {
      title: 'Ações',
      key: 'acoes',
      render: (_, record) => (
        <Space>
          <RoleGate roles={['ADMIN', 'ATENDENTE']}>
            <Button
              type="text"
              icon={<EditOutlined />}
              aria-label="Editar usuário"
              title="Editar"
              className="users-action-btn edit"
              onClick={() => navigate(`/app/usuarios/${record.id}/editar`)}
            />
          </RoleGate>
          <RoleGate roles={['ADMIN', 'ATENDENTE']}>
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              aria-label="Excluir usuário"
              title="Excluir"
              className="users-action-btn delete"
              loading={deletingId === record.id}
              onClick={() => handleDelete(record)}
            />
          </RoleGate>
        </Space>
      ),
    },
  ]

  return (
    <Card
      className="users-list-card"
      title="Gestão de Usuários"
      extra={
        <RoleGate roles={['ADMIN', 'ATENDENTE']}>
          <Button type="primary" className="users-primary-btn" onClick={() => navigate('/app/usuarios/novo')}>
            Novo Usuário
          </Button>
        </RoleGate>
      }
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Input.Search
          placeholder="Buscar por nome, e-mail ou CPF"
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
          <Table<UsuarioDTO>
            className="users-table"
            rowKey={(record) => record.id ?? record.email}
            dataSource={filteredUsers}
            columns={columns}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `${total} usuários`,
            }}
            rowClassName={(_, index) => (index % 2 === 0 ? 'users-row-even' : 'users-row-odd')}
            locale={{ emptyText: <Empty description="Nenhum usuário encontrado" /> }}
            scroll={{ x: 900 }}
          />
        )}
      </Space>
    </Card>
  )
}

export default UserListPage

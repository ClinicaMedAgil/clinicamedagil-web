import {
  Alert,
  Avatar,
  Button,
  Card,
  Divider,
  Form,
  Input,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from 'antd'
import { MailOutlined, UserOutlined } from '@ant-design/icons'
import { useEffect, useMemo, useState } from 'react'
import { authService } from '../../services/authService'
import { userService } from '../../services/userService'
import type { UsuarioDTO } from '../../types/user'
import { formatCpf, formatPhone, onlyDigits } from '../../utils/formatters'
import { parseUsuario409 } from '../../utils/usuarioApiConflict'
import './ProfilePage.css'

interface ProfileFormValues {
  nome: string
  email: string
  cpf: string
  telefone?: string
}

const readStringField = (value: unknown, field: string): string | undefined => {
  if (!value || typeof value !== 'object') {
    return undefined
  }

  const record = value as { [key: string]: unknown }
  const found = record[field]
  return typeof found === 'string' ? found : undefined
}

const ProfilePage = () => {
  const user = useMemo(() => authService.getSessionUser(), [])
  const [form] = Form.useForm<ProfileFormValues>()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<UsuarioDTO | null>(null)

  const tipoUsuarioNome =
    profile?.tipoUsuarioNome ??
    profile?.tipoUsuario ??
    readStringField(profile, 'nomeTipoUsuario') ??
    readStringField(profile, 'tipoUsuarioDescricao') ??
    user?.tipoUsuarioNome ??
    profile?.tipoUsuarioId ??
    user?.tipoUsuarioId ??
    '-'
  const statusAtual = profile?.status ?? user?.status ?? '-'

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true)
      setError(null)
      let profileError = false

      try {
        try {
          const currentUser: UsuarioDTO = await userService.getMe()
          setProfile(currentUser)

          form.setFieldsValue({
            nome: currentUser.nome ?? user?.nome ?? '',
            email: currentUser.email ?? user?.email ?? '',
            cpf: currentUser.cpf
              ? formatCpf(currentUser.cpf)
              : user?.cpf
                ? formatCpf(user.cpf)
                : '',
            telefone: currentUser.telefone
              ? formatPhone(currentUser.telefone)
              : user?.telefone
                ? formatPhone(user.telefone)
                : '',
          })
        } catch {
          profileError = true
          setProfile(null)
        }
      } finally {
        if (profileError) {
          setError('Nao foi possivel carregar todos os dados do perfil.')
        }
        setLoading(false)
      }
    }

    void loadProfile()
  }, [
    form,
    user?.cpf,
    user?.email,
    user?.nome,
    user?.status,
    user?.telefone,
    user?.tipoUsuarioId,
  ])

  const handleCancelEdit = () => {
    setIsEditing(false)
    form.resetFields()
    form.setFieldsValue({
      nome: profile?.nome ?? user?.nome ?? '',
      email: profile?.email ?? user?.email ?? '',
      cpf: profile?.cpf
        ? formatCpf(profile.cpf)
        : user?.cpf
          ? formatCpf(user.cpf)
          : '',
      telefone: profile?.telefone
        ? formatPhone(profile.telefone)
        : user?.telefone
          ? formatPhone(user.telefone)
          : '',
    })
  }

  const handleSaveProfile = async (values: ProfileFormValues) => {
    if (!profile) {
      return
    }

    setSaving(true)
    try {
      const updated = await userService.updateMe({
        nome: values.nome,
        email: values.email,
        cpf: onlyDigits(values.cpf),
        telefone: values.telefone ? onlyDigits(values.telefone) : undefined,
      })
      setProfile(updated)
      setIsEditing(false)
      message.success('Perfil atualizado com sucesso!')
    } catch (err) {
      const conflict = parseUsuario409(err)
      if (conflict.ok) {
        const fields: Parameters<typeof form.setFields>[0] = []
        if (conflict.fieldErrors.cpf) {
          fields.push({ name: 'cpf', errors: [conflict.fieldErrors.cpf] })
        }
        if (conflict.fieldErrors.email) {
          fields.push({ name: 'email', errors: [conflict.fieldErrors.email] })
        }
        if (fields.length) {
          form.setFields(fields)
        }
        if (conflict.globalMessage) {
          message.error(conflict.globalMessage)
        }
      } else {
        message.error('Nao foi possivel atualizar o perfil.')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="profile-card">
      <div className="profile-hero">
        <Space align="center" size="middle">
          <Avatar
            size={72}
            icon={<UserOutlined />}
            className="profile-avatar"
          />
          <div>
            <Typography.Title level={3} style={{ margin: 0 }}>
              {profile?.nome ?? user?.nome ?? 'Perfil do Usuario'}
            </Typography.Title>
            <Typography.Text type="secondary">
              <MailOutlined /> {profile?.email ?? user?.email ?? '-'}
            </Typography.Text>
          </div>
        </Space>
        <Space direction="vertical" size={6} className="profile-meta">
          <Tag className="profile-role-tag">{String(tipoUsuarioNome)}</Tag>
          <Tag color={statusAtual === 'ATIVO' ? 'green' : 'default'}>
            {statusAtual}
          </Tag>
        </Space>
      </div>

      <div className="profile-actions">
        {!isEditing ? (
          <Button type="primary" onClick={() => setIsEditing(true)}>
            Editar perfil
          </Button>
        ) : (
          <Space>
            <Button onClick={handleCancelEdit}>Cancelar</Button>
            <Button
              type="primary"
              loading={saving}
              onClick={() => void form.submit()}
            >
              Salvar alteracoes
            </Button>
          </Space>
        )}
      </div>

      <Divider style={{ margin: '18px 0 20px' }} />

      {error && (
        <Alert
          type="warning"
          showIcon
          message="Dados incompletos"
          description={error}
          style={{ marginBottom: 16 }}
        />
      )}

      {loading ? (
        <div className="profile-loading">
          <Spin />
        </div>
      ) : (
        <Form<ProfileFormValues>
          form={form}
          layout="vertical"
          onFinish={handleSaveProfile}
          className="profile-form"
        >
          <Form.Item
            label="Nome"
            name="nome"
            rules={[{ required: true, message: 'Informe o nome.' }]}
          >
            <Input readOnly={!isEditing} />
          </Form.Item>

          <Form.Item
            label="E-mail"
            name="email"
            rules={[
              { required: true, message: 'Informe o e-mail.' },
              { type: 'email', message: 'Informe um e-mail valido.' },
            ]}
          >
            <Input readOnly={!isEditing} />
          </Form.Item>

          <Form.Item
            label="CPF"
            name="cpf"
            rules={[
              { required: true, message: 'Informe o CPF.' },
              {
                validator: async (_, value: string) => {
                  if (onlyDigits(value ?? '').length !== 11) {
                    throw new Error('CPF deve conter 11 digitos.')
                  }
                },
              },
            ]}
          >
            <Input
              readOnly={!isEditing}
              maxLength={14}
              onChange={(event) => {
                if (isEditing) {
                  form.setFieldValue('cpf', formatCpf(event.target.value))
                }
              }}
            />
          </Form.Item>

          <Form.Item label="Telefone" name="telefone">
            <Input
              readOnly={!isEditing}
              maxLength={15}
              onChange={(event) => {
                if (isEditing) {
                  form.setFieldValue(
                    'telefone',
                    formatPhone(event.target.value)
                  )
                }
              }}
            />
          </Form.Item>
        </Form>
      )}
    </Card>
  )
}

export default ProfilePage

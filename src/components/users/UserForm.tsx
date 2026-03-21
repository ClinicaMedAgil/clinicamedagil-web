import type { FormInstance } from 'antd/es/form'
import { Button, Form, Input, Modal, Select, Space } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { formatCpf, formatPhone, onlyDigits } from '../../utils/formatters'
import type { TipoUsuarioDTO, UsuarioDTO } from '../../types/user'
import type { EspecialidadeDTO } from '../../types/resources'
import { useMemo, useState } from 'react'

const normalizeText = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()

interface UserFormProps {
  form?: FormInstance<UsuarioDTO>
  initialValues?: Partial<UsuarioDTO>
  tiposUsuario: TipoUsuarioDTO[]
  especialidades: EspecialidadeDTO[]
  canManageEspecialidades: boolean
  loading?: boolean
  isEditMode?: boolean
  onSubmit: (values: UsuarioDTO) => Promise<void>
  onCreateEspecialidade: (nomeEspecialidade: string) => Promise<void>
  onCancel: () => void
}

const UserForm = ({
  form: formProp,
  initialValues,
  tiposUsuario,
  especialidades,
  canManageEspecialidades,
  loading = false,
  isEditMode = false,
  onSubmit,
  onCreateEspecialidade,
  onCancel,
}: UserFormProps) => {
  const [internalForm] = Form.useForm<UsuarioDTO>()
  const form = formProp ?? internalForm
  const [especialidadeForm] = Form.useForm<{ nomeEspecialidade: string }>()
  const [openEspecialidadeModal, setOpenEspecialidadeModal] = useState(false)
  const [savingEspecialidade, setSavingEspecialidade] = useState(false)
  const selectedTipoUsuarioId = Form.useWatch('tipoUsuarioId', form)

  const isMedicoSelected = useMemo(() => {
    if (!selectedTipoUsuarioId) {
      return false
    }

    const selectedTipo = tiposUsuario.find((item) => item.id === selectedTipoUsuarioId)
    return selectedTipo?.nome ? normalizeText(selectedTipo.nome).includes('MEDIC') : false
  }, [selectedTipoUsuarioId, tiposUsuario])

  const especialidadeOptions = especialidades.map((especialidade) => ({
    value: Number(especialidade.id),
    label: especialidade.nomeEspecialidade ?? `Especialidade #${especialidade.id ?? '-'}`,
  }))

  const handleFinish = async (values: UsuarioDTO) => {
    await onSubmit({
      ...values,
      cpf: onlyDigits(values.cpf),
      telefone: values.telefone ? onlyDigits(values.telefone) : undefined,
    })
  }

  const handleCreateEspecialidade = async (values: { nomeEspecialidade: string }) => {
    setSavingEspecialidade(true)
    try {
      await onCreateEspecialidade(values.nomeEspecialidade)
      setOpenEspecialidadeModal(false)
      especialidadeForm.resetFields()
    } finally {
      setSavingEspecialidade(false)
    }
  }

  return (
    <Form<UsuarioDTO>
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      initialValues={{
        status: 'ATIVO',
        ...initialValues,
        cpf: initialValues?.cpf ? formatCpf(initialValues.cpf) : undefined,
        telefone: initialValues?.telefone ? formatPhone(initialValues.telefone) : undefined,
      }}
    >
      <Form.Item
        label="Nome"
        name="nome"
        rules={[
          { required: true, message: 'Informe o nome.' },
          { min: 3, message: 'O nome deve ter ao menos 3 caracteres.' },
        ]}
      >
        <Input placeholder="Nome completo" />
      </Form.Item>

      <Form.Item
        label="CPF"
        name="cpf"
        rules={[
          { required: true, message: 'Informe o CPF.' },
          {
            validator: async (_, value: string) => {
              if (onlyDigits(value ?? '').length !== 11) {
                throw new Error('CPF deve conter 11 dígitos.')
              }
            },
          },
        ]}
      >
        <Input
          placeholder="000.000.000-00"
          maxLength={14}
          onChange={(event) => form.setFieldValue('cpf', formatCpf(event.target.value))}
        />
      </Form.Item>

      <Form.Item
        label="E-mail"
        name="email"
        rules={[
          { required: true, message: 'Informe o e-mail.' },
          { type: 'email', message: 'Informe um e-mail válido.' },
        ]}
      >
        <Input placeholder="email@clinica.com" />
      </Form.Item>

      <Form.Item label="Telefone" name="telefone">
        <Input
          placeholder="(00) 00000-0000"
          maxLength={15}
          onChange={(event) => form.setFieldValue('telefone', formatPhone(event.target.value))}
        />
      </Form.Item>

      <Form.Item label="Status" name="status">
        <Select
          placeholder="Selecione o status"
          options={[
            { value: 'ATIVO', label: 'ATIVO' },
            { value: 'INATIVO', label: 'INATIVO' },
          ]}
        />
      </Form.Item>

      <Form.Item
        label="Tipo de Usuário"
        name="tipoUsuarioId"
        rules={[{ required: true, message: 'Selecione o tipo de usuário.' }]}
      >
        <Select
          placeholder="Selecione"
          options={tiposUsuario.map((tipo) => ({
            value: tipo.id,
            label: tipo.nome,
          }))}
        />
      </Form.Item>

      {isMedicoSelected && (
        <Form.Item
          label={
            <Space>
              Especialidade
              {canManageEspecialidades && (
                <Button type="link" icon={<PlusOutlined />} onClick={() => setOpenEspecialidadeModal(true)}>
                  Adicionar especialidade
                </Button>
              )}
            </Space>
          }
          name="especialidadeId"
          rules={[{ required: true, message: 'Selecione uma especialidade para o médico.' }]}
        >
          <Select placeholder="Selecione a especialidade" options={especialidadeOptions} />
        </Form.Item>
      )}

      <Space>
        <Button htmlType="submit" type="primary" loading={loading}>
          {isEditMode ? 'Salvar Alterações' : 'Cadastrar Usuário'}
        </Button>
        <Button onClick={onCancel}>Cancelar</Button>
      </Space>

      <Modal
        title="Cadastrar especialidade"
        open={openEspecialidadeModal}
        onCancel={() => setOpenEspecialidadeModal(false)}
        footer={null}
        destroyOnClose
      >
        <Form<{ nomeEspecialidade: string }>
          form={especialidadeForm}
          layout="vertical"
          onFinish={handleCreateEspecialidade}
        >
          <Form.Item
            label="Nome da especialidade"
            name="nomeEspecialidade"
            rules={[
              { required: true, message: 'Informe o nome da especialidade.' },
              { min: 3, message: 'Informe ao menos 3 caracteres.' },
            ]}
          >
            <Input placeholder="Ex.: Cardiologia" />
          </Form.Item>
          <Space>
            <Button onClick={() => setOpenEspecialidadeModal(false)}>Cancelar</Button>
            <Button type="primary" htmlType="submit" loading={savingEspecialidade}>
              Salvar especialidade
            </Button>
          </Space>
        </Form>
      </Modal>
    </Form>
  )
}

export default UserForm

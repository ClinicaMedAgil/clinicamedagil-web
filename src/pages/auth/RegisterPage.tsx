import {
  CheckCircleOutlined,
  MailOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons'
import { Alert, Button, Form, Input, Typography, message } from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import doctorSignupImage from '../../assets/doctor-signup.png'
import { userService } from '../../services/userService'
import type { PublicRegisterPayload } from '../../types/user'
import { formatCpf, formatPhone, onlyDigits } from '../../utils/formatters'
import { parseUsuario409 } from '../../utils/usuarioApiConflict'
import './LoginPage.css'

interface RegisterFormValues {
  nome: string
  cpf: string
  email: string
  telefone?: string
}

const RegisterPage = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm<RegisterFormValues>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (values: RegisterFormValues) => {
    setLoading(true)
    setError(null)

    const payload: PublicRegisterPayload = {
      nome: values.nome,
      cpf: onlyDigits(values.cpf),
      email: values.email,
      telefone: values.telefone ? onlyDigits(values.telefone) : undefined,
    }

    try {
      await userService.createPublicUser(payload)
      message.success('Cadastro realizado com sucesso! Agora faca seu login.')
      navigate('/login', { replace: true })
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
        setError(conflict.globalMessage)
      } else {
        setError(
          'Nao foi possivel concluir o cadastro. Verifique os dados e tente novamente.'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-screen">
      <section className="auth-left-panel">
        <Typography.Title level={2} className="auth-title">
          Registre-se
        </Typography.Title>
        <Typography.Paragraph className="auth-subtitle">
          Ja tem um acesso?{' '}
          <button
            type="button"
            className="auth-link-action"
            onClick={() => navigate('/login')}
          >
            Entrar
          </button>
        </Typography.Paragraph>

        <Form<RegisterFormValues>
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          {error && (
            <Alert
              type="error"
              showIcon
              title="Falha no cadastro"
              description={error}
              closable
              style={{ marginBottom: 12 }}
            />
          )}

          <Form.Item
            label="Nome"
            name="nome"
            rules={[
              { required: true, message: 'Informe o nome.' },
              { min: 3, message: 'Informe ao menos 3 caracteres.' },
            ]}
          >
            <Input placeholder="Seu nome completo" />
          </Form.Item>

          <Form.Item
            label="E-mail"
            name="email"
            rules={[
              { required: true, message: 'Informe o e-mail.' },
              { type: 'email', message: 'Informe um e-mail valido.' },
            ]}
          >
            <Input
              placeholder="usuario@dominio.com"
              prefix={<MailOutlined />}
            />
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
              placeholder="000.000.000-00"
              maxLength={14}
              onChange={(event) =>
                form.setFieldValue('cpf', formatCpf(event.target.value))
              }
            />
          </Form.Item>

          <Form.Item label="Telefone" name="telefone">
            <Input
              placeholder="(00) 00000-0000"
              maxLength={15}
              onChange={(event) =>
                form.setFieldValue('telefone', formatPhone(event.target.value))
              }
            />
          </Form.Item>

          <Button
            htmlType="submit"
            type="primary"
            loading={loading}
            block
            className="auth-submit"
          >
            Cadastrar
          </Button>
        </Form>
      </section>

      <section className="auth-right-panel">
        <div className="brand-row">
          <SafetyCertificateOutlined className="brand-icon" />
          <Typography.Title level={2} style={{ color: '#fff', margin: 0 }}>
            Clínica MedAgil
          </Typography.Title>
        </div>

        <Typography.Title level={1} className="hero-call">
          Para todas as pessoas que valorizam cuidar da saude.
        </Typography.Title>
        <Typography.Paragraph className="hero-subcall">
          Mais de 20 mil pessoas satisfeitas com nossos servicos. #Seja Clínica
          MedAgil
        </Typography.Paragraph>

        <div className="hero-list">
          {[
            'Consultas medicas',
            'Diagnostico e exames',
            'Exames rapidos e precisos',
            'Atendimento humanizado',
            'Facilidade em agendamento',
          ].map((item) => (
            <Typography.Text key={item} className="hero-list-item">
              <CheckCircleOutlined /> {item}
            </Typography.Text>
          ))}
        </div>

        <div className="doctor-visual">
          <img
            src={doctorSignupImage}
            alt="Cadastro Doctor Signup"
            className="doctor-visual-image"
          />
        </div>
      </section>
    </div>
  )
}

export default RegisterPage

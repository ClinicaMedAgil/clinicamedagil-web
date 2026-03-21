import {
  CheckCircleOutlined,
  EyeInvisibleOutlined,
  MailOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons'
import type { AxiosError } from 'axios'
import { Alert, Button, Form, Input, Typography, message } from 'antd'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import doctorSignupImage from '../../assets/doctor-signup.png'
import { useAuth } from '../../hooks/useAuth'
import { authService } from '../../services/authService'
import type { LoginRequest, UserRole } from '../../types/user'
import './LoginPage.css'

const getDefaultRouteByRole = (roles: UserRole[]): string => {
  if (roles.includes('ADMIN') || roles.includes('ATENDENTE')) {
    return '/app/usuarios'
  }

  if (roles.includes('MEDICO')) {
    return '/app/perfil'
  }

  if (roles.includes('PACIENTE')) {
    return '/app/consultas'
  }

  return '/app/perfil'
}

const LoginPage = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (values: LoginRequest) => {
    setLoading(true)
    setError(null)

    try {
      await login(values)
      message.success('Login realizado com sucesso!')
      const fromRoute = (location.state as { from?: string } | null)?.from
      const redirectTo =
        fromRoute ?? getDefaultRouteByRole(authService.getRoles())
      navigate(redirectTo, { replace: true })
    } catch (error) {
      const status = (error as AxiosError)?.response?.status

      if (status === 401) {
        setError('E-mail ou senha incorretos. Tente novamente.')
      } else if (status === 403) {
        setError(
          'Seu usuário está inativo ou sem acesso. Fale com o administrador.'
        )
      } else {
        setError('Não foi possível realizar login no momento. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-screen">
      <section className="auth-left-panel">
        <Typography.Title level={2} className="auth-title">
          Entrar
        </Typography.Title>
        <Typography.Paragraph className="auth-subtitle">
          Nao tem um acesso?{' '}
          <button
            type="button"
            className="auth-link-action"
            onClick={() => navigate('/register')}
          >
            Registre-se
          </button>
        </Typography.Paragraph>

        <Form<LoginRequest> layout="vertical" onFinish={handleSubmit}>
          {error && (
            <Alert
              type="error"
              showIcon
              title="Falha no login"
              description={error}
              closable
              style={{ marginBottom: 12 }}
            />
          )}

          <Form.Item
            label="E-mail"
            name="email"
            rules={[
              { required: true, message: 'Informe o e-mail.' },
              { type: 'email', message: 'Informe um e-mail válido.' },
            ]}
          >
            <Input
              placeholder="usuario@dominio.com"
              prefix={<MailOutlined />}
            />
          </Form.Item>

          <Form.Item
            label="Senha"
            name="senha"
            rules={[
              { required: true, message: 'Informe a senha.' },
              { min: 6, message: 'A senha deve ter ao menos 6 caracteres.' },
            ]}
          >
            <Input.Password
              placeholder="******"
              iconRender={() => <EyeInvisibleOutlined />}
            />
          </Form.Item>

          <Button
            htmlType="submit"
            type="primary"
            loading={loading}
            block
            className="auth-submit"
          >
            Entrar
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

export default LoginPage

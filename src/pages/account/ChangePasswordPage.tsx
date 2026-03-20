import { Alert, Button, Card, Form, Input, message } from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { authService } from '../../services/authService'

interface ChangePasswordForm {
  senhaAtual: string
  novaSenha: string
  confirmarNovaSenha: string
}

const ChangePasswordPage = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (values: ChangePasswordForm) => {
    setError(null)
    setLoading(true)

    try {
      await authService.changeMyPassword({
        senhaAtual: values.senhaAtual,
        novaSenha: values.novaSenha,
      })
      message.success('Senha alterada com sucesso!')
      navigate('/app/perfil', { replace: true })
    } catch {
      setError('Nao foi possivel alterar a senha. Verifique a senha atual e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card title="Alterar senha">
      {error && (
        <Alert
          type="warning"
          showIcon
          message="Falha ao alterar senha"
          description={error}
          style={{ marginBottom: 16 }}
        />
      )}

      <Form<ChangePasswordForm> layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          label="Senha atual"
          name="senhaAtual"
          rules={[{ required: true, message: 'Informe a senha atual.' }]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item
          label="Nova senha"
          name="novaSenha"
          rules={[
            { required: true, message: 'Informe a nova senha.' },
            { min: 6, message: 'A nova senha deve ter ao menos 6 caracteres.' },
          ]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item
          label="Confirmar nova senha"
          name="confirmarNovaSenha"
          dependencies={['novaSenha']}
          rules={[
            { required: true, message: 'Confirme a nova senha.' },
            ({ getFieldValue }) => ({
              validator: async (_, value) => {
                if (!value || value === getFieldValue('novaSenha')) {
                  return
                }

                throw new Error('As senhas nao coincidem.')
              },
            }),
          ]}
        >
          <Input.Password />
        </Form.Item>

        <Button htmlType="submit" type="primary" loading={loading}>
          Salvar nova senha
        </Button>
      </Form>
    </Card>
  )
}

export default ChangePasswordPage

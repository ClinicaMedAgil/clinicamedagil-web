import { Button, Result } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'

const ForbiddenPage = () => {
  const navigate = useNavigate()

  return (
    <Result
      status="403"
      title="Acesso negado"
      subTitle="Você não possui permissão para acessar esta área."
      extra={
        <>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            Voltar para página anterior
          </Button>
          <Button type="primary" onClick={() => navigate('/app/usuarios')} style={{ marginLeft: 8 }}>
            Voltar para início
          </Button>
        </>
      }
    />
  )
}

export default ForbiddenPage

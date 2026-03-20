import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExperimentOutlined,
  HeartOutlined,
  LoginOutlined,
  SafetyOutlined,
} from '@ant-design/icons'
import { Avatar, Button, Card, Collapse, Space, Typography } from 'antd'
import { useNavigate } from 'react-router'
import './styles.css'

const faqItems = [
  {
    key: '1',
    label: 'Como posso agendar uma consulta?',
    children:
      'Voce pode agendar uma consulta pela nossa plataforma, escolhendo especialidade e horario disponivel.',
  },
  {
    key: '2',
    label: 'Quais exames sao realizados na clinica?',
    children:
      'Realizamos exames laboratoriais, eletrocardiograma, hemograma e diversos exames de imagem.',
  },
  {
    key: '3',
    label: 'Preciso levar algum documento para a consulta?',
    children:
      'Sim. Leve um documento com foto e, se tiver, carteirinha do plano de saude.',
  },
  {
    key: '4',
    label: 'Em quanto tempo recebo o resultado dos exames?',
    children:
      'Depende do exame. Em geral, exames simples ficam prontos em ate 48 horas no portal do paciente.',
  },
]

const Home = () => {
  const navigate = useNavigate()

  return (
    <div className="landing-page">
      <header className="landing-header">
        <Typography.Title level={4} className="logo">
          Clínica MedAgil
        </Typography.Title>
        <Space size="large">
          <Typography.Text>Inicio</Typography.Text>
          <Typography.Text>Servicos</Typography.Text>
          <Typography.Text>Depoimentos</Typography.Text>
          <Typography.Text>FAQ</Typography.Text>
          <Button
            type="primary"
            icon={<LoginOutlined />}
            onClick={() => navigate('/login')}
          >
            Entrar
          </Button>
        </Space>
      </header>

      <section className="hero-section">
        <div>
          <Typography.Title className="hero-title">
            Cuidando da sua saude com <span>excelencia</span>
          </Typography.Title>
          <Typography.Paragraph className="hero-text">
            Atendimento medico humanizado, com profissionais qualificados e
            estrutura moderna para garantir qualidade e confianca.
          </Typography.Paragraph>
          <Space>
            <Button type="primary" size="large">
              Agende Sua Consulta
            </Button>
            <Button size="large" onClick={() => navigate('/login')}>
              Area do Paciente
            </Button>
          </Space>
        </div>
        <div className="doctor-placeholder">
          <HeartOutlined />
        </div>
      </section>

      <section className="highlight-grid">
        <Card>
          <CalendarOutlined /> Facilidade em agendamento
        </Card>
        <Card>
          <ExperimentOutlined /> Exames rapidos e precisos
        </Card>
        <Card>
          <SafetyOutlined /> Resultado medico imediato
        </Card>
      </section>

      <section className="services-section">
        <Typography.Text className="section-tag">Servicos</Typography.Text>
        <Typography.Title level={2}>
          Cuidado medico completo para voce e sua familia
        </Typography.Title>
        <div className="services-grid">
          <Card>
            <ExperimentOutlined /> Exames laboratoriais
          </Card>
          <Card>
            <CheckCircleOutlined /> Raio-X
          </Card>
          <Card>
            <HeartOutlined /> Eletrocardiograma
          </Card>
          <Card>
            <ClockCircleOutlined /> Hemograma
          </Card>
        </div>
      </section>

      <section className="testimonial-section">
        <Typography.Text className="section-tag">Depoimentos</Typography.Text>
        <Typography.Title level={2}>
          A confianca de quem ja cuidou da saude conosco
        </Typography.Title>
        <div className="testimonial-grid">
          {['Mariana', 'Ricardo', 'Camila', 'Andre'].map((name) => (
            <Card key={name}>
              <Space direction="vertical">
                <Space>
                  <Avatar>{name[0]}</Avatar>
                  <Typography.Text strong>{name}</Typography.Text>
                </Space>
                <Typography.Text>
                  Atendimento excelente. Equipe atenciosa e estrutura impecavel.
                </Typography.Text>
                <Typography.Text type="secondary">02/03/2025</Typography.Text>
              </Space>
            </Card>
          ))}
        </div>
      </section>

      <section className="faq-section">
        <Typography.Text className="section-tag">
          Duvidas Frequentes
        </Typography.Text>
        <Typography.Title level={2}>
          Tire suas principais duvidas
        </Typography.Title>
        <Collapse items={faqItems} />
      </section>
    </div>
  )
}

export default Home

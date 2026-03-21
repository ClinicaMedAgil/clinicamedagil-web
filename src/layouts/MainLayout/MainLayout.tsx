import {
  AppstoreOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  DownOutlined,
  LockOutlined,
  LogoutOutlined,
  ScheduleOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { Avatar, Button, Dropdown, Layout, Menu, Space, Typography, theme } from 'antd'
import { useMemo, useState } from 'react'
import type { Key, ReactNode } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../../hooks/useAuth'
import { authService } from '../../services/authService'
import './MainLayout.css'

const { Header, Content, Footer, Sider } = Layout

type MenuItem = Required<MenuProps>['items'][number]

function getItem(
  label: ReactNode,
  key: Key,
  icon?: ReactNode,
  children?: MenuItem[]
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
  } as MenuItem
}

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, roles, hasAnyRole } = useAuth()
  const sessionUser = useMemo(() => authService.getSessionUser(), [roles])
  const papelExibido = useMemo(
    () => authService.getPrimaryRoleLabel() ?? roles[0] ?? '',
    [roles]
  )
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()
  const menuItems = useMemo<MenuItem[]>(() => {
    const baseItems: MenuItem[] = []

    if (hasAnyRole(['ADMIN', 'ATENDENTE'])) {
      baseItems.push(getItem('Usuários', '/app/usuarios', <TeamOutlined />))
      baseItems.push(getItem('Agenda do Médico', '/app/agendas-medico', <ClockCircleOutlined />))
    }

    if (hasAnyRole(['ADMIN', 'ATENDENTE', 'PACIENTE', 'MEDICO'])) {
      baseItems.push(getItem('Minhas consultas', '/app/consultas', <CalendarOutlined />))
    }

    if (hasAnyRole(['ADMIN', 'ATENDENTE', 'PACIENTE'])) {
      baseItems.push(getItem('Agendar consulta', '/app/consultas/agendar', <ScheduleOutlined />))
    }

    if (hasAnyRole(['ADMIN'])) {
      baseItems.push(getItem('Especialidades', '/app/especialidades', <AppstoreOutlined />))
    }

    return baseItems
  }, [hasAnyRole])

  const selectedKeys = useMemo(() => {
    if (location.pathname.startsWith('/app/usuarios')) {
      return ['/app/usuarios']
    }

    if (location.pathname.startsWith('/app/especialidades')) {
      return ['/app/especialidades']
    }

    if (location.pathname.startsWith('/app/agendas-medico')) {
      return ['/app/agendas-medico']
    }

    if (location.pathname.startsWith('/app/consultas/agendar')) {
      return ['/app/consultas/agendar']
    }

    if (location.pathname.startsWith('/app/consultas')) {
      return ['/app/consultas']
    }

    return []
  }, [location.pathname])

  const accountMenuItems: MenuProps['items'] = [
    { key: 'perfil', icon: <UserOutlined />, label: 'Perfil' },
    { key: 'alterar-senha', icon: <LockOutlined />, label: 'Alterar a senha' },
    { type: 'divider' },
    { key: 'deslogar', icon: <LogoutOutlined />, label: 'Deslogar', danger: true },
  ]

  return (
    <Layout className="app-layout">
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        className="app-sider"
      >
        <div className="app-brand">{collapsed ? 'CA' : 'CliniAgil'}</div>
        <Menu
          theme="light"
          selectedKeys={selectedKeys}
          mode="inline"
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ background: colorBgContainer }} className="app-header">
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Typography.Text strong className="app-title">
              CliniAgil - Gestão
            </Typography.Text>

            <Space className="app-account-area">
              <Dropdown
                menu={{
                  items: accountMenuItems,
                  onClick: ({ key }) => {
                    if (key === 'perfil') {
                      navigate('/app/perfil')
                      return
                    }

                    if (key === 'alterar-senha') {
                      navigate('/app/alterar-senha')
                      return
                    }

                    logout()
                    navigate('/login', { replace: true })
                  },
                }}
                trigger={['click']}
              >
                <Button className="account-trigger">
                  <Avatar size={24} icon={<UserOutlined />} className="account-avatar" />
                  <span className="account-label">{sessionUser?.nome ?? 'Conta'}</span>
                  {papelExibido ? <span className="account-role">{papelExibido}</span> : null}
                  <DownOutlined className="account-caret" />
                </Button>
              </Dropdown>
            </Space>
          </Space>
        </Header>
        <Content className="app-content">
          <div style={{ background: colorBgContainer, borderRadius: borderRadiusLG }} className="app-content-box">
            <Outlet />
          </div>
        </Content>
        <Footer className="app-footer">
          CLIAGIL ©{new Date().getFullYear()} Created by FaDevTeam
        </Footer>
      </Layout>
    </Layout>
  )
}

export default MainLayout

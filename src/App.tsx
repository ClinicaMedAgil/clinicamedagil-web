import { ConfigProvider } from 'antd'
import { router } from './routes'
import { RouterProvider } from 'react-router'
import ptBR from 'antd/locale/pt_BR'
import { AuthProvider } from './context/AuthContext'
import './App.css'

function App() {
  return (
    <ConfigProvider
      locale={ptBR}
      theme={{
        token: {
          colorPrimary: '#0f766e',
          colorInfo: '#0f766e',
          colorSuccess: '#10b981',
          colorWarning: '#f59e0b',
          colorError: '#ef4444',
          borderRadius: 12,
          fontFamily:
            '"Inter", "Segoe UI", "Roboto", "Helvetica Neue", Arial, "Noto Sans", sans-serif',
        },
        components: {
          Button: {
            borderRadius: 10,
            controlHeight: 40,
            fontWeight: 600,
          },
          Card: {
            borderRadiusLG: 16,
          },
          Input: {
            borderRadius: 10,
            controlHeight: 40,
          },
          Select: {
            borderRadius: 10,
            controlHeight: 40,
          },
          Menu: {
            itemColor: '#294240',
            itemSelectedColor: '#0f766e',
            itemSelectedBg: 'rgba(15, 118, 110, 0.12)',
            itemHoverColor: '#0f766e',
            itemHoverBg: 'rgba(15, 118, 110, 0.08)',
            itemBorderRadius: 10,
          },
          Layout: {
            triggerBg: '#fff',
            triggerColor: '#0f766e',
          },
        },
      }}
    >
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ConfigProvider>
  )
}

export default App

import { ConfigProvider, DatePicker } from 'antd'
import { router } from './routes'
import { RouterProvider } from 'react-router'
import ptBR from 'antd/locale/pt_BR'
import dayjs from 'dayjs'
import './App.css'

function App() {
  return (
    <ConfigProvider
      locale={ptBR}
      theme={{
        components: {
          Menu: {
            darkItemBg: '#f00',
            itemColor: 'rgb(0, 0, 0)',
            itemSelectedColor: 'rgb(255, 255, 255)',
            itemSelectedBg: 'rgba(1, 138, 115, 0.88)',
            itemHoverBg: 'rgba(1, 138, 115, 0.88)',
            subMenuItemBg: '#f00',
          },
          Layout: {
            triggerBg: '#fff',
            triggerColor: 'rgba(1, 138, 115, 0.88)',
          },
        },
      }}
    >
      <RouterProvider router={router} />
    </ConfigProvider>
  )
}

export default App

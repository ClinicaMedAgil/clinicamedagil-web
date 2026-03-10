import { RouterProvider, createBrowserRouter } from 'react-router'
import { useAuth } from '../provider/authProvider'
import MainLayout from '../layouts/MainLayout/MainLayout'
import ProtectedRoute from './ProtectedRoute'

const Routes = () => {
  const { token } = useAuth()

  const routesForPublic = [
    {
      path: '/',
    },
  ]
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
  },
])

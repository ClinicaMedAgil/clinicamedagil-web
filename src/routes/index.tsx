import { createBrowserRouter } from 'react-router'
import MainLayout from '../layouts/MainLayout/MainLayout'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
  },
])

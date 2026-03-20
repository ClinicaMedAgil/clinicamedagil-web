import { Navigate, createBrowserRouter } from 'react-router'
import MainLayout from '../layouts/MainLayout/MainLayout'
import Home from '../pages/Home'
import ChangePasswordPage from '../pages/account/ChangePasswordPage'
import AgendaMedicoPage from '../pages/agendas/AgendaMedicoPage'
import ProfilePage from '../pages/account/ProfilePage'
import ForbiddenPage from '../pages/auth/ForbiddenPage'
import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'
import ConsultaCalendarPage from '../pages/consultas/ConsultaCalendarPage'
import EspecialidadeListPage from '../pages/especialidades/EspecialidadeListPage'
import UserFormPage from '../pages/users/UserFormPage'
import UserListPage from '../pages/users/UserListPage'
import ProtectedRoute from './ProtectedRoute'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/sem-permissao',
    element: <ForbiddenPage />,
  },
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/app/consultas" replace />,
      },
      {
        path: 'usuarios',
        element: (
          <ProtectedRoute requiredRoles={['ADMIN', 'ATENDENTE']}>
            <UserListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'especialidades',
        element: (
          <ProtectedRoute requiredRoles={['ADMIN']}>
            <EspecialidadeListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'consultas',
        element: (
          <ProtectedRoute>
            <ConsultaCalendarPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'agendas-medico',
        element: (
          <ProtectedRoute requiredRoles={['ADMIN', 'ATENDENTE']}>
            <AgendaMedicoPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'usuarios/novo',
        element: (
          <ProtectedRoute requiredRoles={['ADMIN', 'ATENDENTE']}>
            <UserFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'usuarios/:id/editar',
        element: (
          <ProtectedRoute requiredRoles={['ADMIN', 'ATENDENTE']}>
            <UserFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'perfil',
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'alterar-senha',
        element: (
          <ProtectedRoute>
            <ChangePasswordPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])

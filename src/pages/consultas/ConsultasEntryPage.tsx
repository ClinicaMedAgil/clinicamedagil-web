import { useAuth } from '../../hooks/useAuth'
import ConsultasCalendarioPage from './ConsultasCalendarioPage'
import ConsultasMedicoCalendarioPage from './ConsultasMedicoCalendarioPage'

/**
 * Paciente / gestão: calendário de consultas do paciente (ou lista de gestão).
 * Médico: calendário das próprias consultas com encerramento e prontuário.
 */
const ConsultasEntryPage = () => {
  const { hasAnyRole } = useAuth()
  if (hasAnyRole(['MEDICO'])) {
    return <ConsultasMedicoCalendarioPage />
  }
  return <ConsultasCalendarioPage />
}

export default ConsultasEntryPage

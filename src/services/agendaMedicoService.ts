import { createCrudService } from './crudFactory'
import type { AgendaMedicoDTO, AgendaMedicoPayload } from '../types/resources'

export const agendaMedicoService = createCrudService<AgendaMedicoDTO, AgendaMedicoPayload>(
  '/agendamedicos'
)

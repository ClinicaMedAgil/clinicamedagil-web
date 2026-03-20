import { createCrudService } from './crudFactory'
import type { HorarioAgendaDTO, HorarioAgendaPayload } from '../types/resources'

export const horarioAgendaService = createCrudService<HorarioAgendaDTO, HorarioAgendaPayload>(
  '/horariosagendas'
)

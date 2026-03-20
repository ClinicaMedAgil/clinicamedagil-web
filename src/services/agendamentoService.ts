import { createCrudService } from './crudFactory'
import type { AgendamentoDTO } from '../types/resources'

export const agendamentoService = createCrudService<AgendamentoDTO>('/agendamentos')

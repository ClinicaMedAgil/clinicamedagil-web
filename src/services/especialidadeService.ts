import { createCrudService } from './crudFactory'
import type { EspecialidadeDTO } from '../types/resources'

export const especialidadeService = createCrudService<EspecialidadeDTO>('/especialidades')

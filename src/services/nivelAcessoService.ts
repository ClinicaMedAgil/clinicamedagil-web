import { createCrudService } from './crudFactory'
import type { NivelAcessoDTO } from '../types/resources'

export const nivelAcessoService = createCrudService<NivelAcessoDTO>('/niveisacesso')

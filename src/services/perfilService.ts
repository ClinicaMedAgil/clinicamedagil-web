import { createCrudService } from './crudFactory'
import type { PerfilDTO } from '../types/resources'

export const perfilService = createCrudService<PerfilDTO>('/perfis')

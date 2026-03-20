import { createCrudService } from './crudFactory'
import type { TipoUsuarioDTO } from '../types/user'

export const tipoUsuarioService = createCrudService<TipoUsuarioDTO>('/tiposusuarios')

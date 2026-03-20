import { api } from './api'

export interface CrudService<T, P = T> {
  list: () => Promise<T[]>
  getById: (id: number) => Promise<T>
  create: (payload: P) => Promise<T>
  update: (id: number, payload: Partial<P>) => Promise<T>
  remove: (id: number) => Promise<void>
}

export const createCrudService = <T, P = T>(endpoint: string): CrudService<T, P> => ({
  async list() {
    const { data } = await api.get<T[]>(endpoint)
    return data
  },
  async getById(id) {
    const { data } = await api.get<T>(`${endpoint}/${id}`)
    return data
  },
  async create(payload) {
    const { data } = await api.post<T>(endpoint, payload)
    return data
  },
  async update(id, payload) {
    const { data } = await api.put<T>(`${endpoint}/${id}`, payload)
    return data
  },
  async remove(id) {
    await api.delete(`${endpoint}/${id}`)
  },
})

import { Alert, Card, Spin, message } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import UserForm from '../../components/users/UserForm'
import { useAuth } from '../../hooks/useAuth'
import { especialidadeService } from '../../services/especialidadeService'
import { medicoEspecialidadeService } from '../../services/medicoEspecialidadeService'
import { tipoUsuarioService } from '../../services/tipoUsuarioService'
import { userService } from '../../services/userService'
import type { EspecialidadeDTO } from '../../types/resources'
import type { TipoUsuarioDTO, UsuarioDTO } from '../../types/user'

const normalizeText = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()

const extractLinkIds = (
  link: unknown
): {
  medicoId: number | null
  especialidadeId: number | null
} => {
  if (!link || typeof link !== 'object') {
    return { medicoId: null, especialidadeId: null }
  }

  const record = link as Record<string, unknown>
  const medicoIdRaw = record.medicoId ?? (record.medico as Record<string, unknown> | undefined)?.id
  const especialidadeIdRaw =
    record.especialidadeId ?? (record.especialidade as Record<string, unknown> | undefined)?.id

  const medicoId = Number(medicoIdRaw)
  const especialidadeId = Number(especialidadeIdRaw)

  return {
    medicoId: Number.isFinite(medicoId) ? medicoId : null,
    especialidadeId: Number.isFinite(especialidadeId) ? especialidadeId : null,
  }
}

const UserFormPage = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { roles } = useAuth()

  const isEditMode = useMemo(() => Boolean(id), [id])

  const [loadingPage, setLoadingPage] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tiposUsuario, setTiposUsuario] = useState<TipoUsuarioDTO[]>([])
  const [especialidades, setEspecialidades] = useState<EspecialidadeDTO[]>([])
  const [initialValues, setInitialValues] = useState<Partial<UsuarioDTO>>({})
  const [error, setError] = useState<string | null>(null)

  const getMedicoTipoId = (): number | undefined =>
    tiposUsuario.find((tipo) => (tipo.nome ? normalizeText(tipo.nome).includes('MEDIC') : false))?.id

  useEffect(() => {
    const loadData = async () => {
      setLoadingPage(true)
      setError(null)

      try {
        const tiposPromise = tipoUsuarioService.list()
        const especialidadesPromise = especialidadeService.list()

        if (isEditMode && id) {
          const [tipos, usuario, especialidadesData, links] = await Promise.all([
            tiposPromise,
            userService.getById(Number(id)),
            especialidadesPromise,
            medicoEspecialidadeService.list(),
          ])
          const especialidadeIds = links
            .map((item) => extractLinkIds(item))
            .filter((item) => item.medicoId === Number(id) && item.especialidadeId !== null)
            .map((item) => item.especialidadeId as number)
          setTiposUsuario(tipos)
          setEspecialidades(especialidadesData)
          setInitialValues({ ...usuario, especialidadeId: especialidadeIds[0] })
        } else {
          const [tipos, especialidadesData] = await Promise.all([tiposPromise, especialidadesPromise])
          setTiposUsuario(tipos)
          setEspecialidades(especialidadesData)
        }
      } catch {
        setError('Não foi possível carregar os dados do formulário.')
      } finally {
        setLoadingPage(false)
      }
    }

    void loadData()
  }, [id, isEditMode])

  const handleSubmit = async (values: UsuarioDTO) => {
    setSaving(true)

    try {
      const { especialidadeId, senha: _senha, ...userPayload } = values
      const normalizedEspecialidadeId = Number(especialidadeId)
      const hasEspecialidade = Number.isFinite(normalizedEspecialidadeId) && normalizedEspecialidadeId > 0
      const medicoTipoId = getMedicoTipoId()
      const isMedico = Boolean(medicoTipoId && userPayload.tipoUsuarioId === medicoTipoId)
      let savedUserId: number | null = null

      if (isEditMode && id) {
        const updated = await userService.update(Number(id), userPayload)
        savedUserId = updated.id ?? Number(id)
        message.success('Usuário atualizado com sucesso!')
      } else {
        const created = await userService.create(userPayload)
        savedUserId = created.id ?? null
        message.success('Usuário cadastrado com sucesso!')
      }

      if (savedUserId) {
        const existingLinks = await medicoEspecialidadeService.list()
        const medicoLinks = existingLinks
          .map((item) => extractLinkIds(item))
          .filter((item) => item.medicoId === savedUserId && item.especialidadeId !== null)
          .map((item) => item.especialidadeId as number)

        if (isMedico) {
          const toRemove = medicoLinks.filter((espId) => !hasEspecialidade || espId !== normalizedEspecialidadeId)
          await Promise.all(toRemove.map((espId) => medicoEspecialidadeService.remove(savedUserId as number, espId)))

          if (hasEspecialidade && !medicoLinks.includes(normalizedEspecialidadeId)) {
            await medicoEspecialidadeService.create({
              medicoId: savedUserId as number,
              especialidadeId: normalizedEspecialidadeId,
            })
          }
        } else if (medicoLinks.length > 0) {
          await Promise.all(medicoLinks.map((espId) => medicoEspecialidadeService.remove(savedUserId as number, espId)))
        }
      }

      navigate('/app/usuarios')
    } catch {
      message.error('Erro ao salvar usuário. Verifique os dados e tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateEspecialidade = async (nomeEspecialidade: string) => {
    await especialidadeService.create({ nomeEspecialidade: nomeEspecialidade.trim() })
    const data = await especialidadeService.list()
    setEspecialidades(data)
    message.success('Especialidade cadastrada com sucesso!')
  }

  if (loadingPage) {
    return (
      <Card>
        <Spin />
      </Card>
    )
  }

  return (
    <Card title={isEditMode ? 'Editar Usuário' : 'Novo Usuário'}>
      {error && (
        <Alert
          type="error"
          showIcon
          title="Erro ao carregar formulário"
          description={error}
          style={{ marginBottom: 16 }}
        />
      )}

      {!error && (
        <UserForm
          initialValues={initialValues}
          tiposUsuario={tiposUsuario}
          especialidades={especialidades}
          canManageEspecialidades={roles.includes('ADMIN')}
          loading={saving}
          isEditMode={isEditMode}
          onSubmit={handleSubmit}
          onCreateEspecialidade={handleCreateEspecialidade}
          onCancel={() => navigate('/app/usuarios')}
        />
      )}
    </Card>
  )
}

export default UserFormPage

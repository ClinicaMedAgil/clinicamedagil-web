# ClinicaMedAgil Frontend

Interface web do sistema ClinicaMedAgil.

Tecnologias:
- React
- Node.js
- Nginx
- Docker
- GitHub Actions

Responsável por:
- interface do usuário
- consumo da API backend
- experiência de navegação do sistema


# CliniAgil Frontend - Integracao com API

## Configuracao

1. Crie o arquivo `.env` na raiz do frontend (variável do Vite):

```env
VITE_FRONTEND_API_URL=/clinicamedagil-service
```

2. Em desenvolvimento local, se a API estiver em outra origem, use a URL completa (ex.: `http://localhost:8081/clinicamedagil-service`).

3. Na VM com Docker, use `VITE_FRONTEND_API_URL=/clinicamedagil-service` e configure no `docker-compose` (ou `.env` ao lado dele) `BACKEND_HOST` e `BACKEND_PORT` para o endereço onde o Spring Boot escuta **visto de dentro do container do frontend**. O `172.19.0.1` é IP interno da rede Docker, não o IP público da Oracle; o navegador do usuário não deve apontar para ele. O nginx do container encaminha `POST /clinicamedagil-service/...` para a API — sem esse proxy, o nginx devolve **405** para métodos que não são `GET` em arquivos estáticos.

## Autenticacao JWT

- Login: `POST /auth/login`
- Request:

```json
{
  "email": "usuario@dominio.com",
  "senha": "123456"
}
```

- Response:

```json
{
  "token": "jwt...",
  "tipo": "Bearer"
}
```

O token e salvo em `localStorage` e enviado automaticamente no header:

`Authorization: Bearer <token>`

## Fluxo implementado

- Tela de login em `/login`
- Logout no cabecalho da aplicacao
- Protecao de rotas privadas com redirecionamento para login
- Controle de acesso por role (UI): `ADMIN`, `ATENDENTE`, `MEDICO`, `USUARIO`
- Tratamento padronizado para erros `401`, `403`, `404` e `5xx`

## Exemplo funcional completo

1. Acesse `/login` e autentique.
2. Apos login, o sistema redireciona para `/usuarios`.
3. A pagina `/usuarios` consome:
   - `GET /usuarios`
   - `GET /tiposusuarios`
4. Acoes de criar/editar/excluir ficam visiveis conforme role.

## Camada de servicos

- Cliente central: `src/services/api.ts`
- Auth: `src/services/authService.ts`
- CRUD:
  - `src/services/userService.ts`
  - `src/services/tipoUsuarioService.ts`
  - `src/services/perfilService.ts`
  - `src/services/nivelAcessoService.ts`
  - `src/services/especialidadeService.ts`
  - `src/services/agendamentoService.ts`
  - `src/services/agendaMedicoService.ts`
  - `src/services/consultaService.ts`
  - `src/services/horarioAgendaService.ts`
  - `src/services/medicoEspecialidadeService.ts` (rota composta)
  - `src/services/pacienteAgendamentoCatalogoService.ts` (catálogo: especialidades, médicos por especialidade, horários por médico)
  - `agendamentoService.createFromHorario` — cria vínculo paciente + `horarioId` antes do `POST /consultas`

## Rodar projeto

```bash
npm install
npm run dev
```

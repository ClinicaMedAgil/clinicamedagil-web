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

1. Crie o arquivo `.env` na raiz do frontend:

```env
FRONTEND_API_URL=http://localhost:8081/clinicamedagil-service
```

2. Caso a variavel nao exista, o frontend usa automaticamente:

`http://localhost:8081/clinicamedagil-service`

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

## Rodar projeto

```bash
npm install
npm run dev
```

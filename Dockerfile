# Estágio 1: build do Vite (URL da API embutida no bundle — use caminho relativo em produção)
FROM node:20-alpine AS build
WORKDIR /app
ARG VITE_FRONTEND_API_URL=/clinicamedagil-service
ENV VITE_FRONTEND_API_URL=$VITE_FRONTEND_API_URL
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Estágio 2: Nginx — proxy /clinicamedagil-service/ → API em BACKEND_HOST:BACKEND_PORT (rede privada)
FROM nginx:stable-alpine
# Padrão: IP privado da VM da API e Spring em :8080 (sobrescreva com env no compose)
ENV BACKEND_HOST=172.19.0.1
ENV BACKEND_PORT=8080
# Só substitui BACKEND_* no template; preserva $uri, $host etc. do nginx
ENV NGINX_ENVSUBST_FILTER=^(BACKEND_HOST|BACKEND_PORT)$

COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
<<<<<<< HEAD
=======
# reenviando
>>>>>>> e1e3837196b587f210536ac9dc8677a54b6bbf9a

# Estágio 1: Build
FROM node:20-alpine as build
WORKDIR /app
ARG VITE_FRONTEND_API_URL=/clinicamedagil-service
ENV VITE_FRONTEND_API_URL=$VITE_FRONTEND_API_URL
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Estágio 2: Servir com Nginx (template com envsubst: BACKEND_HOST, BACKEND_PORT)
FROM nginx:stable-alpine
ENV BACKEND_HOST=172.19.0.1
ENV BACKEND_PORT=8080
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
# Copia os arquivos buildados para a pasta do Nginx
COPY --from=build /app/dist /usr/share/nginx/html
# Expõe a porta 80
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
# reenviando

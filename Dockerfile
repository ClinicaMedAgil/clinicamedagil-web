# Estágio 1: Build
FROM node:20-alpine as build
WORKDIR /app
ARG VITE_FRONTEND_API_URL=/clinicamedagil-service
ENV VITE_FRONTEND_API_URL=$VITE_FRONTEND_API_URL
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Estágio 2: Servir com Nginx
FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copia os arquivos buildados para a pasta do Nginx
COPY --from=build /app/dist /usr/share/nginx/html
# Expõe a porta 80
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
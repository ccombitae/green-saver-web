# Etapa 1: compilar la aplicación React con Vite
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
# URL pública de la API; se fija al compilar: docker build --build-arg VITE_API_URL=https://... .
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Etapa 2: servir los archivos estáticos con nginx
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
# Cloud Run / App Service asignan el puerto en la variable PORT (por defecto 8080)
ENV PORT=8080
EXPOSE 8080

# Dockerfile (único)
FROM node:20-alpine AS development

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]

# --------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Dependencias primero: esta capa se cachea mientras no cambien
# package.json / package-lock.json.
COPY package*.json ./
RUN npm ci

COPY . .

# Los ARG/ENV van DESPUES de npm ci: un valor distinto de VITE_API_URL
# invalida solo las capas de abajo (el build), no la instalacion.
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Mostrar para debug (opcional)
RUN echo "Building with VITE_API_URL=$VITE_API_URL"

RUN npm run build

# --------------------------------------------
FROM nginx:alpine AS production

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
# --- Stage 1: Build ---
FROM --platform=$BUILDPLATFORM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

# Instala todas as dependências (incluindo devDependencies para o build)
RUN npm ci

COPY . .

# Compila o projeto (Gera a pasta /dist)
RUN npm run build

# Verifica se o build foi gerado corretamente
RUN ls -la dist/ && test -f dist/main.js

# --- Stage 2: Production ---
FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./

# Instala apenas dependências de produção
RUN npm ci --omit=dev

# Copia o build gerado no estágio anterior
COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 3000

USER node

CMD ["node", "dist/main"]
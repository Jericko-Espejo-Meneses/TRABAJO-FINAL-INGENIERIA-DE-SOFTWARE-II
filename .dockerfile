# =============================================================
# HealthExpress Backend - .dockerfile Multi-Stage (NestJS + Prisma + SQL Server)
# =============================================================

# 1. Base Image con dependencias del sistema requeridas por Prisma Engine
FROM node:20-slim AS base
WORKDIR /app
RUN apt-get update -y && \
    apt-get install -y --no-install-recommends openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# 2. Dependencias de desarrollo y compilación
FROM base AS dependencies
COPY package*.json ./
RUN npm ci

# 3. Compilación del código TypeScript y generación del cliente Prisma
FROM dependencies AS builder
COPY prisma ./prisma/
RUN npx prisma generate

COPY tsconfig*.json nest-cli.json ./
COPY src ./src/
RUN npm run build
RUN npm prune --omit=dev

# 4. Imagen final de producción (optimizada y ligera)
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

# Crear usuario sin privilegios para ejecutar la aplicación de forma segura
RUN groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs -s /bin/sh nestjs

# Copiar artefactos y dependencias de producción
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

USER nestjs

EXPOSE 3000

CMD ["node", "dist/main.js"]

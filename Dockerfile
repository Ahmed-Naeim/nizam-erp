# Multi-stage Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app

# Install deps (including dev deps for build)
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# Copy source and build
COPY . .
RUN npm run build:nizam-erp

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy built app and node_modules from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copy .env if present (recommended to set envs via secrets in prod)
ARG ENV_FILE=.env
COPY ${ENV_FILE} ./.env

EXPOSE 3000

# Run migrations then start the app
CMD ["sh", "-c", "node dist/apps/nizam-erp/src/scripts/migrate-runner.js && node dist/apps/nizam-erp/main.js"]

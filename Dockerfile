# ==========================================
# Multi-stage Dockerfile for Universal Board & Card Game Platform (V2.0)
# Exposes Port 3000 (Next.js Web UI & Studio) and Port 1999 (WebSocket Server)
# ==========================================

FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# 1. Dependencies Stage
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# 2. Builder Stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 3. Production Runner Stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV WS_PORT=1999

# Copy necessary production artifacts
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./

# Startup script to run both WebSocket engine and Next.js web application
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'PORT=${WS_PORT:-1999} npx tsx src/server/standalone.ts &' >> /app/start.sh && \
    echo 'npx next start -p ${PORT:-3000}' >> /app/start.sh && \
    chmod +x /app/start.sh

EXPOSE 3000
EXPOSE 1999

CMD ["/app/start.sh"]

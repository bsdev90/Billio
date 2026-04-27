# syntax=docker/dockerfile:1

# ---------- Build stage ----------
FROM node:20-alpine AS builder
WORKDIR /app

# better-sqlite3 is a native module and needs a C/C++ toolchain at install time
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# DATABASE_URL is required at module-import time by src/lib/server/db; supply
# a throwaway path so SvelteKit's build-time analyse pass can load the server
# modules. The actual runtime path is set in the runtime stage.
RUN DATABASE_URL=/tmp/build.db npm run build && npm prune --omit=dev

# ---------- Runtime stage ----------
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    DATABASE_URL=/data/local.db

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/build ./build
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/package.json ./package.json

RUN mkdir -p /data

VOLUME ["/data"]
EXPOSE 3000

CMD ["node", "build"]

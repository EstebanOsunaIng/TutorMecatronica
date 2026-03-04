FROM node:20-alpine AS build

WORKDIR /app

COPY . .

# Supports both build contexts:
# - frontend service root (contains package.json + src)
# - monorepo root (contains frontend/package.json)
RUN APP_DIR="frontend"; \
    if [ -f package.json ] && [ -d src ]; then APP_DIR="."; fi; \
    cd "$APP_DIR"; \
    npm pkg delete dependencies.tutormecatronica || true; \
    npm ci

# Vite reads VITE_* at build time
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN APP_DIR="frontend"; \
    if [ -f package.json ] && [ -d src ]; then APP_DIR="."; fi; \
    cd "$APP_DIR"; \
    npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=build /app /app

ENV NODE_ENV=production
EXPOSE 4173

CMD ["sh", "-c", "if [ -f /app/package.json ] && [ -d /app/src ]; then cd /app; else cd /app/frontend; fi; npm run start"]

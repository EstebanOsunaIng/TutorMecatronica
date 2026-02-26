FROM node:20-alpine

WORKDIR /app

COPY . .

# Supports both build contexts:
# - backend service root (contains package.json + src)
# - monorepo root (contains backend/package.json)
RUN APP_DIR="backend"; \
    if [ -f package.json ] && [ -d src ]; then APP_DIR="."; fi; \
    cd "$APP_DIR"; \
    npm pkg delete dependencies.tutormecatronica || true; \
    npm ci --omit=dev

ENV NODE_ENV=production
EXPOSE 3001

CMD ["sh", "-c", "if [ -f /app/package.json ] && [ -d /app/src ]; then cd /app; else cd /app/backend; fi; npm run start"]

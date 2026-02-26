FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./

# The local monorepo dependency (file:..) is not needed in container
RUN npm pkg delete dependencies.tutormecatronica || true

RUN npm ci

COPY . .

# Vite reads VITE_* at build time
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=build /app ./

ENV NODE_ENV=production
EXPOSE 4173

CMD ["npm", "run", "start"]

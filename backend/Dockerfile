FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# The local monorepo dependency (file:..) is not needed in container
RUN npm pkg delete dependencies.tutormecatronica || true

RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
EXPOSE 3001

CMD ["npm", "run", "start"]

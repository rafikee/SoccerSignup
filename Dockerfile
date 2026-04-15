FROM node:20-slim AS builder
WORKDIR /app

ENV NODE_ENV=development
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN NODE_ENV=production npm run build

FROM node:20-slim
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

RUN mkdir -p data
ENV NODE_ENV=production
EXPOSE 5000
VOLUME ["/app/data"]

CMD ["node", "dist/index.js"]

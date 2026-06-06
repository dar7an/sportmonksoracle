FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json next.config.mjs tsconfig.json ./
COPY app ./app
COPY src ./src
COPY openapi.yaml ./openapi.yaml
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/app ./app
COPY --from=builder /app/src ./src
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/openapi.yaml ./openapi.yaml
EXPOSE 3000
CMD ["npm", "start"]

FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
COPY tsconfig.json ./
COPY prisma ./prisma
RUN npx prisma generate
RUN npm run build

FROM node:20-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/* && \
    groupadd --system appgroup && \
    useradd --system --gid appgroup appuser
COPY package*.json ./
RUN npm ci --only=production && npm install prisma@5.22.0
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
RUN chown -R appuser:appgroup /app
USER appuser
EXPOSE 3000
CMD ["node", "dist/index.js"]

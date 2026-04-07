FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
COPY tsconfig.json ./
COPY prisma ./prisma
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY package*.json ./
RUN npm ci --only=production && npm install prisma@5.22.0
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
RUN chown -R appuser:appgroup /app
USER appuser
EXPOSE 3000
CMD ["node", "dist/index.js"]

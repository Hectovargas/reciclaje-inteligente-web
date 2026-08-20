# Builder stage
FROM node:20-alpine AS builder

WORKDIR /app
RUN apk add --no-cache openssl
RUN npm install -g pnpm

# Copy workspace configuration
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/backend/package.json ./apps/backend/

# Install backend dependencies
RUN pnpm install --filter backend... --prod=false

# Copy Prisma schema and generate client
COPY apps/backend/prisma ./apps/backend/prisma
RUN cd apps/backend && npx prisma generate

# Copy backend source code and build
COPY apps/backend ./apps/backend
RUN cd apps/backend && pnpm build

# Production runner stage
FROM node:20-alpine AS runner

WORKDIR /app
RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV PORT=3000

# Copy compiled backend output, dependencies and prisma schema
COPY --from=builder /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=builder /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma

WORKDIR /app/apps/backend

EXPOSE 3000

# Start in production mode with migrations
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]

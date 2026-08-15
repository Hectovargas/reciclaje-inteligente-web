# Builder stage
FROM node:20-alpine AS builder

WORKDIR /app
RUN apk add --no-cache openssl
RUN npm install -g pnpm

# Copy workspace configuration
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/backend/package.json ./apps/backend/

# Install all dependencies (including devDeps for nest build)
RUN pnpm install --filter backend... --prod=false

# Copy source and generate Prisma client
COPY apps/backend/prisma ./apps/backend/prisma
RUN cd apps/backend && pnpm prisma:generate

# Copy rest of the backend source code
COPY apps/backend ./apps/backend

# Build the application
RUN cd apps/backend && pnpm build

# Production stage
FROM node:20-alpine

WORKDIR /app
RUN apk add --no-cache openssl

# Copy package metadata and dependencies from builder
COPY --from=builder /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=builder /app/apps/backend/package.json ./apps/backend/package.json

# Copy compiled backend output and prisma schema
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma

WORKDIR /app/apps/backend

EXPOSE 3000

# Start in production mode with migrations
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]

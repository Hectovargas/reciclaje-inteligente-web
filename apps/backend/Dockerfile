FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace config and package.json files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/backend/package.json ./apps/backend/

# Install all dependencies (including dev for build)
RUN pnpm install --filter backend...

# Copy Prisma schema and generate client
COPY apps/backend/prisma ./apps/backend/prisma
RUN cd apps/backend && pnpm prisma:generate

# Copy application code and build (nest build compiles src/ → dist/)
COPY apps/backend ./apps/backend
RUN cd apps/backend && pnpm build
# Compile the seed script separately (nest build only covers src/, seed lives in prisma/)
RUN cd apps/backend && npx tsc --outDir dist prisma/seed.ts --module commonjs --target ES2021 --esModuleInterop true --skipLibCheck true

# --- Production Image ---
FROM node:20-alpine AS runner

WORKDIR /app

RUN npm install -g pnpm

COPY --from=builder /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./
COPY --from=builder /app/apps/backend/package.json ./apps/backend/

# Install production deps only (includes @prisma/client and prisma CLI for migrate deploy)
RUN pnpm install --filter backend... --prod

# Copy compiled application (dist/ includes main app)
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist


# Copy Prisma schema (needed for migrate deploy at runtime)
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma

# Copy the generated Prisma client from the builder stage to avoid regeneration
# We only copy the generated client artifacts, not the entire .pnpm tree
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

WORKDIR /app/apps/backend

EXPOSE 3000

CMD ["node", "dist/main"]

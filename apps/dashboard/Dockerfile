# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace configuration and lock files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/dashboard/package.json ./apps/dashboard/

# Install dependencies for dashboard
RUN pnpm install --filter dashboard...

# Copy application source code
COPY apps/dashboard ./apps/dashboard

# Build the dashboard app
RUN cd apps/dashboard && pnpm build

# Production stage
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/apps/dashboard/dist /usr/share/nginx/html

# Copy custom Nginx configuration for React Router
COPY apps/dashboard/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

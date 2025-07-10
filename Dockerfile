# Germansphere SaaS Platform - Docker Configuration
# Multi-stage build for optimized production deployment

# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy frontend package files
COPY package.json pnpm-lock.yaml ./

# Install frontend dependencies
RUN pnpm install --frozen-lockfile

# Copy frontend source code
COPY . .

# Build frontend
RUN pnpm build

# Stage 2: Build Backend
FROM node:18-alpine AS backend-builder

WORKDIR /app

# Copy backend package files
COPY server/package.json server/package-lock.json ./

# Install backend dependencies
RUN npm ci --only=production

# Copy backend source code
COPY server ./

# Build backend
RUN npm run build

# Stage 3: Production Image
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S germansphere -u 1001

# Set working directory
WORKDIR /app

# Copy built backend
COPY --from=backend-builder --chown=germansphere:nodejs /app/dist ./server/dist
COPY --from=backend-builder --chown=germansphere:nodejs /app/node_modules ./server/node_modules
COPY --from=backend-builder --chown=germansphere:nodejs /app/package.json ./server/

# Copy built frontend
COPY --from=frontend-builder --chown=germansphere:nodejs /app/dist ./frontend/dist

# Install serve to serve frontend
RUN npm install -g serve

# Create start script
RUN echo '#!/bin/sh\n\
serve /app/frontend/dist -s -l 3000 &\n\
cd /app/server && node dist/server.js\n\
' > /app/start.sh && chmod +x /app/start.sh

# Switch to non-root user
USER germansphere

# Expose ports
EXPOSE 3000 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Start application
ENTRYPOINT ["dumb-init", "--"]
CMD ["/app/start.sh"]

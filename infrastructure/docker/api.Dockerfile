# Stage 1: Builder
# Requirement: Containerization - Multi-stage build for minimal image size
FROM node:16-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies and Python for node-gyp
# Requirement: Security - Container security best practices
RUN apk add --no-cache python3 make g++ \
    && addgroup -S node && adduser -S node -G node

# Copy package files for dependency caching
COPY src/backend/package*.json ./

# Install dependencies including development ones needed for build
RUN npm ci

# Copy TypeScript configuration
COPY src/backend/tsconfig.json ./

# Copy source code
COPY src/backend/src ./src/

# Build application
RUN npm run build

# Prune development dependencies
RUN npm prune --production

# Stage 2: Production
# Requirement: Backend Technologies - NestJS backend service running on Node.js 16+
FROM node:16-alpine

# Set working directory
WORKDIR /app

# Create non-root user and group
# Requirement: Security - Run as non-root user
RUN addgroup -S node && adduser -S node -G node

# Install runtime dependencies
RUN apk add --no-cache curl tzdata

# Copy production dependencies
COPY --from=builder /app/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/dist ./dist

# Copy package.json for scripts
COPY src/backend/package.json ./

# Set permissions for non-root user
RUN chown -R node:node /app

# Create and set permissions for tmp directory
RUN mkdir -p /tmp && chown -R node:node /tmp

# Switch to non-root user
USER node

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV TZ=UTC

# Expose API port
EXPOSE 3000

# Configure health check
# Requirement: Containerization - Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Set security options
# Requirement: Security - Security best practices
LABEL org.opencontainers.image.authors="Mint Replica Lite Team" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.description="Mint Replica Lite API Service" \
      org.opencontainers.image.base.name="node:16-alpine" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${VCS_REF}"

# Set read-only root filesystem and drop capabilities
# These will be enforced by Kubernetes security context
ENV NODE_OPTIONS="--no-deprecation"

# Define volumes for persistence
VOLUME ["/app/node_modules", "/tmp"]

# Start the application
CMD ["npm", "run", "start:prod"]
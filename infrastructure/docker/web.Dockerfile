# Human Tasks:
# 1. Configure API_BASE_URL in deployment environment
# 2. Set up SSL certificates for production NGINX
# 3. Configure monitoring and logging collection
# 4. Review and adjust security headers based on environment
# 5. Set up CDN if required for static assets

# Stage 1: Builder
# Implements Technical Specification/5.3.1 Frontend Technologies - Build environment for React/TypeScript
FROM node:16-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY src/web/package*.json ./

# Install production dependencies only
# @version @reduxjs/toolkit ^1.9.5
# @version axios ^1.4.0
# @version chart.js ^4.3.0
# @version date-fns ^2.30.0
# @version plaid ^13.0.0
# @version react ^18.2.0
# @version react-chartjs-2 ^5.2.0
# @version react-dom ^18.2.0
# @version react-router-dom ^6.11.0
# @version zod ^3.21.0
RUN npm ci --only=production

# Copy source code
COPY src/web/ ./

# Set build environment variables
ARG API_BASE_URL
ENV VITE_API_BASE_URL=${API_BASE_URL}
ENV NODE_ENV=production

# Run TypeScript compilation and generate production bundle
RUN npm run typecheck && \
    npm run build

# Clean development dependencies
RUN rm -rf node_modules

# Stage 2: Production
# Implements Technical Specification/10.3.1 Docker Configuration - Multi-stage build pattern
FROM nginx:1.24-alpine

# Remove default nginx user
RUN deluser nginx && \
    addgroup -S nginx -g 101 && \
    adduser -S -G nginx -u 101 -H -D nginx

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
RUN mkdir -p /etc/nginx/templates
COPY infrastructure/config/nginx.conf /etc/nginx/templates/default.conf.template

# Set correct permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Configure security headers
# Implements Technical Specification/9.3.5 Secure Development - Security headers
RUN echo 'add_header X-Content-Type-Options "nosniff";' >> /etc/nginx/conf.d/security.conf && \
    echo 'add_header X-Frame-Options "DENY";' >> /etc/nginx/conf.d/security.conf && \
    echo 'add_header X-XSS-Protection "1; mode=block";' >> /etc/nginx/conf.d/security.conf && \
    echo 'add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";' >> /etc/nginx/conf.d/security.conf && \
    echo 'add_header Content-Security-Policy "default-src '\''self'\''; connect-src '\''self'\'' https://*.plaid.com; img-src '\''self'\'' data: https:; style-src '\''self'\'' '\''unsafe-inline'\'';";' >> /etc/nginx/conf.d/security.conf

# Enable HTTP/2
RUN sed -i 's/listen 80;/listen 80 http2;/' /etc/nginx/conf.d/default.conf

# Configure compression
RUN echo 'gzip on;' >> /etc/nginx/conf.d/compression.conf && \
    echo 'gzip_types text/plain text/css text/javascript application/javascript application/json image/svg+xml application/xml text/xml application/x-javascript text/ecmascript;' >> /etc/nginx/conf.d/compression.conf && \
    echo 'gzip_min_length 1000;' >> /etc/nginx/conf.d/compression.conf && \
    echo 'gzip_proxied any;' >> /etc/nginx/conf.d/compression.conf && \
    echo 'brotli on;' >> /etc/nginx/conf.d/compression.conf && \
    echo 'brotli_types text/plain text/css text/javascript application/javascript application/json image/svg+xml application/xml text/xml application/x-javascript text/ecmascript;' >> /etc/nginx/conf.d/compression.conf

# Configure static file caching
RUN echo 'location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {' >> /etc/nginx/conf.d/static.conf && \
    echo '    expires 30d;' >> /etc/nginx/conf.d/static.conf && \
    echo '    add_header Cache-Control "public, no-transform";' >> /etc/nginx/conf.d/static.conf && \
    echo '}' >> /etc/nginx/conf.d/static.conf && \
    echo 'location ~* \.(woff|woff2|ttf|eot)$ {' >> /etc/nginx/conf.d/static.conf && \
    echo '    expires 365d;' >> /etc/nginx/conf.d/static.conf && \
    echo '    add_header Cache-Control "public, no-transform";' >> /etc/nginx/conf.d/static.conf && \
    echo '}' >> /etc/nginx/conf.d/static.conf

# Remove unnecessary tools and packages
RUN rm -rf /usr/local/sbin/* && \
    rm -rf /usr/local/bin/* && \
    rm -rf /usr/sbin/* && \
    rm -rf /usr/bin/* && \
    rm -rf /sbin/* && \
    rm -rf /bin/*

# Set user to non-root nginx
USER nginx

# Configure read-only root filesystem
VOLUME ["/var/cache/nginx", "/var/log/nginx", "/var/run"]

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget -q --spider http://localhost/ || exit 1

# Container metadata
LABEL maintainer="Mint Replica Lite Team" \
      version="${VERSION}" \
      description="Mint Replica Lite Web Application"

# Drop capabilities and prevent privilege escalation
RUN echo 'no-new-privileges=true' >> /etc/nginx/nginx.conf && \
    echo 'capabilities=drop=ALL' >> /etc/nginx/nginx.conf

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
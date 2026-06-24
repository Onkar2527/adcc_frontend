# Multi-stage build for Angular frontend using Caddy
# Stage 1: Build the Angular application
FROM node:20 AS builder

WORKDIR /usr/src/app

# Copy dependency files
COPY package*.json ./

# Install dependencies (using npm ci for clean, reproducible builds)
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the Angular application for production
RUN npm run build

# Stage 2: Serve the application using Caddy
FROM caddy:2-alpine

# Copy Caddyfile configuration
COPY Caddyfile /etc/caddy/Caddyfile

# Copy build output from builder stage to Caddy root directory
# According to angular.json, the output goes to ./out/ng/browser
COPY --from=builder /usr/src/app/out/ng/browser /usr/share/caddy

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Fix line endings of entrypoint script to prevent execution errors on Linux
RUN sed -i 's/\r$//' /entrypoint.sh

# Expose Caddy ports (HTTP)
EXPOSE 80

# Set entrypoint to run the configuration generator before caddy starts
ENTRYPOINT ["/entrypoint.sh"]

# Default command to run Caddy
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]

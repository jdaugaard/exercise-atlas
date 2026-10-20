# syntax=docker/dockerfile:1
FROM node:24-alpine

WORKDIR /app

# Install production dependencies (zod)
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy configuration, source code, and catalog
COPY tsconfig.json ./
COPY src/ ./src/
COPY catalog/ ./catalog/

# Default environment configuration
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4317

EXPOSE 4317

# Built-in healthcheck using the native health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4317/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

CMD ["node", "src/server.ts"]

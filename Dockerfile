# Stage 1: Build the frontend
FROM node:22-slim AS frontend-builder
WORKDIR /app/ff
COPY ff/package*.json ./
RUN npm ci
COPY ff/ ./
RUN npm run build

# Stage 2: Build the backend and run the service
FROM node:22-slim
WORKDIR /app

# Install system dependencies for whatsapp-web.js with Baileys (no Chrome needed)
RUN apt-get update && apt-get install -y \
    ca-certificates \
    build-essential \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Copy backend
WORKDIR /app/bb
COPY bb/package*.json ./
RUN npm ci
COPY bb/ ./

# Copy built frontend from Stage 1 to the exact relative path
COPY --from=frontend-builder /app/ff/dist /app/ff/dist

# Expose port
EXPOSE 5000

# Set environment variables
ENV PORT=5000
ENV NODE_ENV=production

# Start application
CMD ["npm", "start"]

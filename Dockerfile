# Stage 1: Build the frontend
FROM node:18-slim AS frontend-builder
WORKDIR /app/ff
COPY ff/package*.json ./
RUN npm ci
COPY ff/ ./
RUN npm run build

# Stage 2: Build the backend and run the service
FROM node:18-slim
WORKDIR /app

# Install system dependencies for Puppeteer (needed for whatsapp-web.js)
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    procps \
    libxss1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libxshmfence1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Install Google Chrome
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set Puppeteer environment variables
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

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

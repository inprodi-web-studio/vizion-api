# Etapa 1: Construcción
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install Chromium and necessary dependencies
RUN apk add --no-cache chromium ca-certificates

# Set environment variables for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copy package.json and yarn.lock
COPY package*.json ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the application
RUN yarn build

# Etapa 2: Imagen final
FROM node:18-alpine AS final

# Set working directory
WORKDIR /app

# Install Chromium and necessary dependencies
RUN apk add --no-cache chromium ca-certificates

# Copy built files from the builder stage
COPY --from=builder /app /app

# Set environment variables for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    NODE_ENV=production

# Install production dependencies
RUN yarn install --frozen-lockfile --production

# Expose the port the app runs on
EXPOSE 8080

# Log current directory and its contents for debugging
RUN echo "Current directory: $(pwd)" && ls -la

# Clean any potential cache issues
RUN rm -rf /var/cache/apk/*

# Run the application
CMD ["yarn", "start"]

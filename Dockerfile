# Use Node 18 alpine image
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install Chromium
RUN apk add --no-cache chromium ca-certificates

# Set environment variables for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copy package.json and yarn.lock
COPY package*.json ./

# Install dependencies
RUN yarn install

# Copy the rest of the application code
COPY . .

# Build the application
RUN yarn build

# Use Node 18 alpine image for the final stage
FROM node:18-alpine AS final

# Set working directory
WORKDIR /app

# Install Chromium
RUN apk add --no-cache chromium ca-certificates

# Copy built files from the builder stage
COPY --from=builder /app /app

# Set environment variables for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Expose the port the app runs on
EXPOSE 8080

# Run the application
CMD ["yarn", "start"]

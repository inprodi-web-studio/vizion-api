# Etapa 1: Construcción
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy the rest of the application code
COPY . .

# Install dependencies
RUN yarn install --frozen-lockfile

# Build the application
RUN yarn build

FROM node:18-alpine AS final

# Install Chromium and necessary dependencies
RUN apk add --no-cache chromium ca-certificates

# Set environment variables for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV PUPPETEER_EXECUTABLE_PATH /usr/bin/chromium-browser

# Set working directory
WORKDIR /app

# Copy built files from the builder stage
COPY --from=builder /app /app

# Copy package.json and yarn.lock
COPY package.json .
COPY yarn.lock .

# Install production dependencies
RUN yarn install --frozen-lockfile --production
RUN echo "Contents of /app/node_modules after yarn install --production:" && ls -la /app/node_module
RUN echo "Si alcanzó a instalar las dependencias de producción"

# Expose the port the app runs on
EXPOSE 8080

# Run the application
CMD ["yarn", "start"]
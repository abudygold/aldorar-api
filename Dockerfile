# Multi-stage Dockerfile for dev and prod environments

# Base stage: Install dependencies
FROM node:22-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Dev stage: For development environment
FROM base AS dev

# Copy source code
COPY . .

# Set environment for development
ENV NODE_ENV=development
ENV PORT=3001

# Expose port
EXPOSE 3001

# Run in development mode (assumes npm script 'dev' exists)
CMD ["npm", "run", "dev"]

# Prod stage: For production environment
FROM base AS prod

# Copy source code
COPY . .

# Set environment for production
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Run server in production
CMD ["node", "server.js"]
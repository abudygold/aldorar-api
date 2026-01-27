# Use the official Node.js image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose API port
EXPOSE 3000

# Run server
CMD ["node", "server.js"]
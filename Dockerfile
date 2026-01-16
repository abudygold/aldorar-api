# STAGE 1: Build the binary
FROM golang:1.25-alpine AS builder

# Set the working directory inside the builder
WORKDIR /app

# Copy dependency files first (optimizes Docker caching)
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the source code
COPY . .

# Build the application
# CGO_ENABLED=0 ensures the binary is statically linked (crucial for Alpine/Scratch)
RUN CGO_ENABLED=0 GOOS=linux go build -o aldorar-api .

# STAGE 2: Run the binary
FROM alpine:latest

# Install certificates for HTTPS requests
# RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy the binary from the builder stage
# We name it 'server' and place it in the current WORKDIR
COPY --from=builder /app/aldorar-api .

# Expose the port your app runs on
EXPOSE 8080

# Run the binary
ENTRYPOINT ["./aldorar-api", "--port", "8080"]
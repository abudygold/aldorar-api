# ---------- Build stage ----------
FROM golang:1.25-alpine AS builder

WORKDIR /app

# Install CA certs & git
RUN apk add --no-cache ca-certificates git

# Copy go mod files first (for cache)
COPY go.mod go.sum ./
RUN go mod download

# Copy source
COPY . .

# Build binary
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -o aldorar-api

# ---------- Runtime stage ----------
FROM alpine:3.19

WORKDIR /app

# Install CA certs
RUN apk add --no-cache ca-certificates

# Copy binary from builder
COPY --from=builder /app/server .

# Expose port (example: 8080)
EXPOSE 8080

# Run app
CMD ["./aldorar-api"]

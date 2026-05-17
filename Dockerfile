# syntax=docker/dockerfile:1.7

# ---------- 1. Build ----------
FROM node:22-alpine AS builder
WORKDIR /app

# Cacheable dep install
COPY package.json package-lock.json ./
RUN npm ci

# Build the static site (includes content collections + OG image generation)
COPY . .
RUN npm run build

# ---------- 2. Serve ----------
FROM nginx:1.27-alpine AS runner

# Replace default config with our tuned one
RUN rm /etc/nginx/conf.d/default.conf
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built site
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# nginx in foreground so the container stays alive
CMD ["nginx", "-g", "daemon off;"]

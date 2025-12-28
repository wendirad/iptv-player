# syntax=docker/dockerfile:1

FROM node:18-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runner
ENV NODE_ENV=production
WORKDIR /usr/share/nginx/html

RUN apk add --no-cache curl
RUN rm -f /etc/nginx/conf.d/default.conf
RUN cat > /etc/nginx/conf.d/default.conf <<'EOF'
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    include /etc/nginx/mime.types;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location = /healthz {
        access_log off;
        add_header Content-Type text/plain;
        return 200 "ok";
    }
}
EOF

COPY --from=builder /app/build .

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD curl -fsS http://localhost/healthz || exit 1
CMD ["nginx", "-g", "daemon off;"]

# Panel de cotizaciones PyP — sitio estático + PocketBase
# Build en Coolify (contexto = raíz del repo):
#   stage 1 compila el sitio con Astro, stage 2 lo sirve con PocketBase.

# ---------- Stage 1: build del sitio ----------
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# ---------- Stage 2: runtime PocketBase ----------
FROM alpine:3.21
ARG PB_VERSION=0.40.4
RUN apk add --no-cache curl ca-certificates unzip
WORKDIR /pb
RUN curl -fsSL -o pb.zip \
      "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip" \
 && unzip pb.zip && rm pb.zip && chmod +x pocketbase
COPY pb_hooks ./pb_hooks
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh
COPY --from=build /app/dist ./pb_public
VOLUME /pb/pb_data
EXPOSE 8090
ENTRYPOINT ["./docker-entrypoint.sh"]

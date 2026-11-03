# Build: set VITE_SITE_URL to the public address, e.g. https://voyager.fieldops.uk
FROM node:22-alpine AS build
WORKDIR /app
ARG VITE_SITE_URL
RUN test -n "$VITE_SITE_URL" || (echo "Set the VITE_SITE_URL build argument to the site's public address" && exit 1)
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build && npm run check:size

FROM nginx:1.28-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY deploy/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q --spider http://127.0.0.1/ || exit 1

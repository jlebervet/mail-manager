FROM node:18-alpine AS build

WORKDIR /app

# Copier package.json
COPY package.json ./

# Installer avec NPM (plus stable que yarn)
RUN npm install --legacy-peer-deps

# Copier le reste
COPY . .

# Variables d'environnement
ARG REACT_APP_BACKEND_URL
ARG REACT_APP_AZURE_CLIENT_ID
ARG REACT_APP_AZURE_TENANT_ID
ARG REACT_APP_AZURE_REDIRECT_URI
ARG REACT_APP_AZURE_SCOPE

ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL
ENV REACT_APP_AZURE_CLIENT_ID=$REACT_APP_AZURE_CLIENT_ID
ENV REACT_APP_AZURE_TENANT_ID=$REACT_APP_AZURE_TENANT_ID
ENV REACT_APP_AZURE_REDIRECT_URI=$REACT_APP_AZURE_REDIRECT_URI
ENV REACT_APP_AZURE_SCOPE=$REACT_APP_AZURE_SCOPE

# Build
RUN npm run build

# Production
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

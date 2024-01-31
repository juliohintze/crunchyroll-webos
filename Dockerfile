FROM node:lts
LABEL org.opencontainers.image.source https://github.com/mateussouzaweb/crunchyroll-webos
LABEL maintainer="Mateus Souza <mateussouzaweb@gmail.com>"
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies
RUN apt update && apt install -y make sed curl
RUN mkdir -p /usr/local/bin 
RUN curl https://mateussouzaweb.github.io/compactor/install.sh | bash
RUN npm install -g rollup

# Create app directory
WORKDIR /app
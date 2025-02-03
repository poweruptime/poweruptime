FROM node:22-alpine
LABEL org.opencontainers.image.source=https://github.com/poweruptime/poweruptime

COPY dist/poweruptime-web ./
CMD node server/server.mjs
EXPOSE 4200

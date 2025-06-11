FROM node:22-alpine
LABEL org.opencontainers.image.source=https://github.com/poweruptime/poweruptime

COPY dist/poweruptime-web ./

EXPOSE 4200

CMD node server/server.mjs

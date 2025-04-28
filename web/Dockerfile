FROM node:22-alpine
LABEL org.opencontainers.image.source=https://github.com/poweruptime/poweruptime

COPY dist/poweruptime-web ./

# Copy the entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Set the entrypoint
ENTRYPOINT ["/entrypoint.sh"]

CMD node server/server.mjs
EXPOSE 4200

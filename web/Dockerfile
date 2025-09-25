FROM gcr.io/distroless/nodejs22-debian12:nonroot
LABEL org.opencontainers.image.source=https://github.com/poweruptime/poweruptime

USER nonroot

COPY dist/poweruptime-web ./
COPY HealthCheck.js ./

EXPOSE 4200

HEALTHCHECK \
  --interval=30s \
  --timeout=10s \
  --retries=5 \
  --start-period=60s \
  CMD ["/nodejs/bin/node", "HealthCheck.js"]

CMD ["server/server.mjs"]

FROM node:24-slim AS sharp-builder
ARG TARGETARCH
WORKDIR /app
# Map Docker's TARGETARCH (amd64/arm64) to npm's cpu values (x64/arm64)
RUN CPU=$([ "$TARGETARCH" = "amd64" ] && echo "x64" || echo "$TARGETARCH") && \
    npm install --os=linux --cpu=$CPU --include=optional sharp

FROM gcr.io/distroless/nodejs24-debian12:nonroot
LABEL org.opencontainers.image.source=https://github.com/poweruptime/poweruptime

USER nonroot

COPY dist/poweruptime-web ./
COPY HealthCheck.js ./
COPY --from=sharp-builder /app/node_modules ./node_modules

EXPOSE 4200

HEALTHCHECK \
  --interval=30s \
  --timeout=10s \
  --retries=5 \
  --start-period=60s \
  CMD ["/nodejs/bin/node", "HealthCheck.js"]

CMD ["server/server.mjs"]

FROM openjdk:21-jdk-slim as certs
RUN apt-get update \
    && apt-get install -y ca-certificates \
    && rm -rf /var/lib/apt/lists/*

FROM gcr.io/distroless/java21-debian12:nonroot
LABEL org.opencontainers.image.source=https://github.com/poweruptime/poweruptime

# Copy HealthCheck.java into the container image it to be used as a Docker HealthCheck provider
COPY HealthCheck.java .

# Copy certs from none-distroless container (fixes some HTTP errors becoming certificate trust errors)
COPY --from=certs /etc/ssl/certs /etc/ssl/certs

# hack to get a mount point where the nonroot user is allowed to write
COPY --chown=nonroot:nonroot --chmod=770 docker/poweruptime /var/lib/poweruptime

COPY build/libs/backend.jar server.jar

CMD ["-Djava.security.egd=file:/dev/urandom", "-Dspring.profiles.active=container", "server.jar"]

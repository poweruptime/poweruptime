# 1) Build stage: install certs + compile HealthCheck.java
FROM amazoncorretto:21.0.9 AS builder

WORKDIR /app

# copy & compile your health‐check tool
COPY HealthCheck.java .
RUN javac HealthCheck.java

# 2) Runtime stage: distroless + nonroot + your server.jar
FROM gcr.io/distroless/java21-debian12:nonroot
LABEL org.opencontainers.image.source=https://github.com/poweruptime/poweruptime

USER nonroot

# distroless's JAVA_HOME
ENV JAVA_HOME=/usr/local/openjdk-21
WORKDIR /app

# bring in the system certs & Java truststore from builder
COPY --from=builder /etc/ssl/certs /etc/ssl/certs
COPY --from=builder /usr/lib/jvm/java-21-amazon-corretto/lib/security/cacerts \
                     $JAVA_HOME/lib/security/cacerts

# bring in just the compiled health‐check class
COPY --from=builder /app/HealthCheck.class .

# your main app and writable dir for the nonroot user
COPY build/libs/backend.jar server.jar
COPY --chown=nonroot:nonroot --chmod=770 \
     docker/poweruptime /var/lib/poweruptime

HEALTHCHECK \
  --interval=30s \
  --timeout=10s \
  --retries=5 \
  --start-period=120s \
  CMD ["java", "-cp", "/app", "HealthCheck"]

CMD ["-Djava.security.egd=file:/dev/urandom", "-Dspring.profiles.active=container", "server.jar"]

# 1) Build stage: install certs + compile HealthCheck.java
FROM openjdk:21-jdk-slim AS builder

# install system CA bundle & Java truststore
RUN apt-get update \
 && apt-get install -y ca-certificates ca-certificates-java \
 && update-ca-certificates -f \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# copy & compile your health‐check tool
COPY HealthCheck.java .
RUN javac HealthCheck.java

# 2) Runtime stage: distroless + nonroot + your server.jar
FROM gcr.io/distroless/java21-debian12:nonroot
LABEL org.opencontainers.image.source=https://github.com/poweruptime/poweruptime

# distroless's JAVA_HOME
ENV JAVA_HOME=/usr/local/openjdk-21
WORKDIR /app

# bring in the system certs & Java truststore from builder
COPY --from=builder /etc/ssl/certs /etc/ssl/certs
COPY --from=builder /usr/local/openjdk-21/lib/security/cacerts \
                     $JAVA_HOME/lib/security/cacerts

# bring in just the compiled health‐check class
COPY --from=builder /app/HealthCheck.class .

# your main app and writable dir for the nonroot user
COPY build/libs/backend.jar server.jar
COPY --chown=nonroot:nonroot --chmod=770 \
     docker/poweruptime /var/lib/poweruptime

CMD ["-Djava.security.egd=file:/dev/urandom", "-Dspring.profiles.active=container", "server.jar"]

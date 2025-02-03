FROM gcr.io/distroless/java17-debian12:nonroot
LABEL org.opencontainers.image.source=https://github.com/powerutpime/backend
# hack to get a mount point where the nonroot user is allowed to write
COPY --chown=nonroot:nonroot --chmod=660 docker/poweruptime /var/lib/poweruptime
COPY build/libs/backend.jar server.jar
CMD ["-Djava.security.egd=file:/dev/urandom", "-Dspring.profiles.active=container", "server.jar"]
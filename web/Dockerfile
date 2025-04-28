FROM node:22-alpine

LABEL org.opencontainers.image.source=\
"https://github.com/poweruptime/poweruptime"

# set a working dir
WORKDIR /app

# copy your built files
COPY dist/poweruptime-web ./

# copy and fix permissions on entrypoint
COPY entrypoint.sh .
RUN chmod +x ./entrypoint.sh

# expose and run
EXPOSE 4200
ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "server/server.mjs"]

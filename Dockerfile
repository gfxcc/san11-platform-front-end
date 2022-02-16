FROM node:16

WORKDIR /app
COPY ./ /app

RUN npm install -g @angular/cli
RUN npm install 

# Workaround due to https://github.com/webpack/webpack/issues/14532
# ENV NODE_OPTIONS=--openssl-legacy-provider

CMD ["ng", "serve", "--configuration", "production", "--host", "0.0.0.0", "--disable-host-check"]
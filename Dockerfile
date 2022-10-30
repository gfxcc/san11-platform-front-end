FROM node:16.10

RUN npm install -g @angular/cli

WORKDIR /app
CMD ng serve --host 0.0.0.0
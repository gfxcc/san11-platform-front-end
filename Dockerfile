FROM node:16

WORKDIR /app
COPY ./ /app

RUN npm install -g @angular/cli
RUN npm install 

CMD ["ng", "serve", "--configuration", "production", "--host", "0.0.0.0", "--port", "80"]

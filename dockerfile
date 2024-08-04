FROM node:18-alpine

WORKDIR /usr/src/app
COPY package*.json ./
RUN yarn install
COPY . .

EXPOSE 3002
FROM node:alpine

WORKDIR /client

COPY package.json package-lock.json ./

RUN npm i

COPY . .

CMD npm run serve

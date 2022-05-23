FROM --platform=linux/amd64 node:lts-alpine

WORKDIR /

COPY ./package.json ./package.json
COPY ./package-lock.json ./package-lock.json

RUN npm install --only=production

COPY . .

CMD [ "npm", "start" ]
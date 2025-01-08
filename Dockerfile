FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

RUN npm install -g ts-node typescript cors dotenv express --save-dev @types/node

COPY . .

EXPOSE 8100

CMD ["npm", "run", "start"]
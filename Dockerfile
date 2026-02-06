# stage 1: Build 
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./ 

RUN npm install

COPY . .

# stage 2: Production image 

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app .

ENV NODE_ENV=Production

EXPOSE 5000

CMD ["node", "server.js"]

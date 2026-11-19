
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --include=dev

COPY . .

RUN npm run build

EXPOSE 3000

ENTRYPOINT ["npm"]
CMD ["run", "start:prod"]

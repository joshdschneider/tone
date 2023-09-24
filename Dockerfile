FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run start

EXPOSE 5555
CMD ["node", "dist/index"]
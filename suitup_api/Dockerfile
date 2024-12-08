FROM node:latest

WORKDIR /app

COPY . .

RUN rm -rf node_modules
RUN npm install

EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && npm run dev"]
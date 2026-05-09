FROM node:18-alpine
WORKDIR /app

COPY package.json tsconfig.json ./
RUN npm install --production && npm install --no-save typescript@5.2.2

COPY src ./src
COPY migrations ./migrations

RUN npx tsc

EXPOSE 3001
CMD ["node", "dist/index.js"]

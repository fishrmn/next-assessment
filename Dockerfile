FROM node:22.22.0-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN HUSKY=0 npm ci

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0"]

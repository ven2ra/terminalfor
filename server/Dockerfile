FROM node:20-alpine
WORKDIR /app

COPY package.json ./
# python3/make/g++ — только для сборки нативного модуля better-sqlite3 из
# исходников на alpine (нет прекомпилированного бинарника под musl);
# удаляются сразу после установки, чтобы не раздувать образ
RUN apk add --no-cache --virtual .build-deps python3 make g++ \
  && npm install --omit=dev \
  && apk del .build-deps

COPY . .

EXPOSE 4000
CMD ["node", "index.js"]

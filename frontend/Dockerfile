### STAGE 1: Builder ###
FROM node:24-bullseye AS builder

RUN apt-get update && apt-get install -y --no-install-recommends libc6

WORKDIR /app

COPY ./nextjs_code/pnpm-lock.yaml ./nextjs_code/package.json ./
ENV NODE_ENV=production
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY ./nextjs_code ./
RUN pnpm build
RUN rm -rf .next/cache && find . -type f -name '*.map' -exec rm -f {} +
RUN pnpm prune --prod


### STAGE 2: Runner ###
FROM node:24-bullseye AS runner

RUN apt-get update && apt-get install -y --no-install-recommends libc6

WORKDIR /app

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node_modules/.bin/next", "start"]

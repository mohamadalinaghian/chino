### STAGE 1: Build ###
FROM node:20-alpine AS builder

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY ./nextjs_code/pnpm-lock.yaml ./nextjs_code/package.json ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY ./nextjs_code .

RUN pnpm build

# حذف dev dependencies در builder و انتقال فقط نهایی‌ها
RUN pnpm prune --prod

### STAGE 2: Runtime ###
FROM node:20-alpine AS runner

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["node_modules/.bin/next", "start"]

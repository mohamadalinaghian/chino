### STAGE 1: Build ###
FROM node:20-alpine AS builder

# ابزار لازم
RUN apk add --no-cache libc6-compat

# محل پروژه
WORKDIR /app

# نصب pnpm
RUN npm install -g pnpm

# اضافه کردن dependency‌ها
COPY ./nextjs_code/pnpm-lock.yaml ./nextjs_code/package.json ./
RUN pnpm install --frozen-lockfile

# کپی باقی پروژه
COPY ./nextjs_code .

# بیلد
RUN pnpm build


### STAGE 2: Runtime ###
FROM node:20-alpine AS runner

RUN apk add --no-cache libc6-compat

WORKDIR /app

# کپی فقط فایل‌های لازم
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# پورت
EXPOSE 3000

# اجرای سرور (بدون نیاز به pnpm global)
CMD ["node_modules/.bin/next", "start"]

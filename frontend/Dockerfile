### STAGE 1: Build ###
FROM node:20-alpine AS builder

# نصب کتابخانه‌ها و سازگاری‌های لازم
RUN apk add --no-cache libc6-compat

# تنظیم مسیر کاری
WORKDIR /app

# کپی و نصب dependency‌ها با pnpm
COPY ./nextjs_code/pnpm-lock.yaml ./nextjs_code/package.json ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# کپی کل سورس پروژه
COPY ./nextjs_code .

# بیلد پروژه
RUN pnpm build


### STAGE 2: Runtime ###
FROM node:20-alpine AS runner

# نصب کتابخانه‌های پایه برای اجرا
RUN apk add --no-cache libc6-compat

WORKDIR /app

# فقط فایل‌های ضروری برای اجرای نهایی
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# حذف وابستگی‌های dev برای کاهش حجم
RUN cd /app && npm prune --omit=dev || true

# باز کردن پورت
EXPOSE 3000

# اجرای اپ
CMD ["node_modules/.bin/next", "start"]

### STAGE 2: Runtime ###
FROM node:20-alpine AS runner

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# بهترین گزینه برای حذف dev dependencies با npm:
RUN npm prune --omit=dev || true

EXPOSE 3000

CMD ["node_modules/.bin/next", "start"]

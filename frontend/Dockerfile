### STAGE 2: Runtime ###
FROM node:20-alpine AS runner

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY --from=runner /app/public ./public
COPY --from=runner /app/.next ./.next
COPY --from=runner /app/package.json ./package.json
COPY --from=runner /app/node_modules ./node_modules

# بهترین گزینه برای حذف dev dependencies با npm:
RUN npm prune --omit=dev || true

EXPOSE 3000

CMD ["node_modules/.bin/next", "start"]

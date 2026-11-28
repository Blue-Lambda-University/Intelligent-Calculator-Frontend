FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install --no-audit --no-fund
FROM node:22-alpine AS builder
ARG NEXT_PUBLIC_TRACE_DATA_FLOW=0
ENV NEXT_PUBLIC_TRACE_DATA_FLOW=$NEXT_PUBLIC_TRACE_DATA_FLOW
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
FROM node:22-alpine AS runner
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app
RUN addgroup -S calc && adduser -S calc -G calc
COPY --from=builder --chown=calc:calc /app/.next/standalone ./
COPY --from=builder --chown=calc:calc /app/.next/static ./.next/static
USER calc
EXPOSE 3000
CMD ["node","server.js"]

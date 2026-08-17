# --- Build stage: installs all deps (incl. dev) and builds the frontend + server bundle ---
FROM node:22-slim AS builder
WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

# --- Runtime stage: only production dependencies + built artifacts ---
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

# Persistent volume mount point for the SQLite database (see render.yaml).
RUN mkdir -p /data
ENV DATA_DIR=/data

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/server.cjs"]

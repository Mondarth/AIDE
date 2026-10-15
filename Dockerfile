# syntax=docker/dockerfile:1
#
# The AIDE web app as a container image. Runs the same `aide` command as the npm install.
#
#   docker build -t aide .
#   docker run --rm -p 3000:3000 aide
#
# Pinned by digest; Dependabot proposes updates.
ARG NODE_IMAGE=node:24-slim@sha256:a5f4366e834695d5f363b920c104953a535d3a9864d1bdf74566a0ebe01daee5

# --- Base: Node with the project's pinned pnpm ---------------------------------------------
FROM ${NODE_IMAGE} AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    CI=true \
    HUSKY=0
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# --- Build the web app and the host -----------------------------------------------------------
FROM base AS build
# `prepare` needs the sources, which are not copied yet; the build regenerates what it would.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --ignore-scripts
COPY . .
RUN pnpm build

# --- Production dependencies only -------------------------------------------------------------
FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile --ignore-scripts \
    && mkdir -p node_modules

# --- Runtime ----------------------------------------------------------------------------------
FROM ${NODE_IMAGE} AS runtime
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000
WORKDIR /app

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/build ./build
COPY --from=build /app/dist/host ./dist/host

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["node", "-e", "fetch(`http://127.0.0.1:${process.env.PORT}/healthz`).then(r => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]

# The CLI stops cleanly on SIGTERM, so `docker stop` does not have to wait for the kill timeout.
ENTRYPOINT ["node", "dist/host/cli.js"]

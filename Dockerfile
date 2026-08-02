# Use a specific Node.js LTS version on Alpine for a small, secure base
FROM node:23.5.0-alpine

# Create a non-root user and group
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# NEXT_PUBLIC_* vars are inlined into the client bundle at build time
ARG NEXT_PUBLIC_WEBSOCKET_URL
ENV NEXT_PUBLIC_WEBSOCKET_URL=$NEXT_PUBLIC_WEBSOCKET_URL

# Copy package files and install dependencies
COPY --chown=appuser:appgroup package*.json ./
RUN npm ci

# Copy the rest of the code and build
COPY --chown=appuser:appgroup . .
RUN npm run build

# Drop devDependencies now that the build is done
RUN npm prune --omit=dev

USER appuser

EXPOSE 3000

CMD ["npm", "start"]

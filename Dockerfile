# ─────────────────────────────────────────────
# PromptWars — Google Cloud Run Dockerfile
# ─────────────────────────────────────────────

# Step 1: Build the TypeScript code
FROM node:20-slim AS builder

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev deps for tsc)
RUN npm install

# Copy source and public folder
COPY src/ ./src/
COPY public/ ./public/

# Compile TypeScript
RUN npm run build

# Step 2: Production environment
FROM node:20-slim AS runner

WORKDIR /usr/src/app

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy built code from builder step
COPY --from=builder /usr/src/app/dist ./dist
# Copy public assets for static serving
COPY --from=builder /usr/src/app/public ./public

# Set production environment
ENV NODE_ENV=production
# Cloud Run expects the app to listen on PORT
ENV PORT=8080

EXPOSE 8080

# Start the server
CMD [ "npm", "start" ]

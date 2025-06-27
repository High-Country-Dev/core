# Use Node.js 20 Alpine for smaller image size
FROM node:20-alpine

# Install pnpm globally
RUN npm install -g pnpm@9.15.4

# Set working directory
WORKDIR /app

# Copy package files from workspace root
COPY ../../package.json ../../pnpm-lock.yaml ../../pnpm-workspace.yaml ./
COPY ../../turbo.json ./

# Copy all package.json files from workspaces
COPY ../../actions/*/package.json ./actions/
COPY ../../configs/*/package.json ./configs/
COPY ../../packages/*/package.json ./packages/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy entire workspace source code
COPY ../../ ./

# Build the action and its dependencies
RUN pnpm build --filter=@mtndev/clean-up-preview-deployment

# Set the entry point to your action
ENTRYPOINT ["node", "actions/clean-up-preview-deployment/cjs/index.cjs"]

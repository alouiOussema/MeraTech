FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Install a simple static server
RUN npm install -g serve

# Expose port 5173
EXPOSE 5173

# Start the static server
CMD ["serve", "-s", "dist", "-l", "5173"]

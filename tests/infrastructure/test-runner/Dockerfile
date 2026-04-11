# Base image with Python and Node.js
FROM mcr.microsoft.com/playwright:v1.42.1-focal

# Set working directory
WORKDIR /app

# Install Python and dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Copy package files first for caching
COPY package*.json ./
COPY requirements.txt ./

# Install Javascript dependencies
RUN npm install

# Install Python dependencies
RUN pip3 install --no-cache-dir -r requirements.txt

# Install Playwright browsers (already in the base image, but ensure dependencies are checked)
RUN npx playwright install-deps
RUN npx playwright install chromium

# Copy the rest of the automation framework (mapped via volumes in compose, but included for standalone build)
COPY . .

# Set execution permission for scripts
RUN chmod +x ./scripts/*.sh

# Default command
CMD ["./scripts/run-tests.sh"]

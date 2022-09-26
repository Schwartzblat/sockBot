# Using debian testing is very much not ideal, but it's the easiest
# way to get ffmpeg 5. One day, we'll use the latest stable version.
FROM debian:bookworm

WORKDIR /app

# Install binaries
RUN apt-get update && apt-get install -y \
    nodejs \
    npm \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*


# Install dependencies
COPY package*.json ./
RUN npm install

# Bundle app
COPY . .

# Run app
CMD ["npm", "start"]

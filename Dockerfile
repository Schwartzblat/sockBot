# Using debian testing is very much not ideal, but it's the easiest
# way to get ffmpeg 5. One day, we'll use the latest stable version.
FROM debian:bookworm

WORKDIR /app

# Install binaries
RUN apt update
RUN apt install -y nodejs npm
RUN apt install -y ffmpeg


# Install dependencies
COPY package*.json ./
RUN npm install

# Bundle app
COPY . .

# Run app
CMD ["npm", "start"]
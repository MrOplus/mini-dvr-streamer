FROM node:23-bookworm 
# Copy the package.json and package-lock.json
RUN apt update && apt install ffmpeg -y
COPY package*.json ./

# Install the dependencies

RUN npm install

# Copy the rest of the files

COPY . .

CMD ["npm", "start"]
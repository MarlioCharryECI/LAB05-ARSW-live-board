#!/bin/bash
# Uncomment the next line if you want to see the commands being executed
# set -x

# Navigate to the frontend directory
cd board-frontend

# Install dependencies
npm install

# Build the application
npm run build

# Copy the built files to the root directory for Azure
cp -r dist/* ../

echo "Build completed successfully"

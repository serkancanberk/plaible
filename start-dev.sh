#!/bin/bash
# Development server startup script with proper environment variables

echo "🚀 Starting Plaible development server..."

# Set development environment variables
export NODE_ENV=development
export DEV_FAKE_USER=1

# Start the server
node server.js

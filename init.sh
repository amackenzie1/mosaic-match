#!/bin/bash

echo "Initializing MosaicMatch standalone repository..."

# Initialize git repo
git init

# Create initial commit
git add .
git commit -m "Initial commit: MosaicMatch extracted from main Mosaic website"

# Install dependencies
echo "Installing dependencies..."
npm install

echo ""
echo "✅ MosaicMatch standalone repository is ready!"
echo ""
echo "Next steps:"
echo "1. Configure your environment variables in .env.local"
echo "2. Set up your Google Cloud credentials"
echo "3. Configure Nakama server connection"
echo "4. Set up Pinecone database"
echo "5. Run 'npm run dev' to start the development server"
echo ""
echo "To deploy the trait embedding service:"
echo "cd backend/trait-embedding-service"
echo "npm install && npm run build"
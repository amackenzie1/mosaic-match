# MosaicMatch Standalone

AI-powered personality matching application extracted from the main Mosaic website.

## Features

- Real-time personality matching using AI embeddings
- Nakama game server integration for live matching
- Vertex AI for trait analysis
- Pinecone vector database for similarity search

## Tech Stack

- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- Nakama Game Server
- Google Vertex AI
- Pinecone Vector Database
- AWS Amplify Auth

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env.local` and fill in your credentials:
   ```bash
   cp .env.example .env.local
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

See `.env.example` for required environment variables.

## Project Structure

- `/app` - Next.js app directory with pages and API routes
- `/components/mosaic-match` - Core MosaicMatch components and logic
- `/components/ui` - Shared UI components (shadcn/ui)
- `/lib` - Utilities and configurations
- `/public` - Static assets

## Architecture

- Frontend: Next.js 14 with App Router
- Backend: Next.js API routes + Express microservice
- Real-time: Nakama game server
- AI: Google Vertex AI
- Vector DB: Pinecone
- Auth: AWS Amplify (to be replaced with standalone auth)

## Deployment

The application consists of two parts:
1. Next.js web application (deploy to Vercel, AWS, etc.)
2. Trait embedding microservice (in `backend/trait-embedding-service`)

Both need to be deployed separately.

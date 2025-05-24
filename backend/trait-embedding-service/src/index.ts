import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import config from './config';
import logger from './utils/logger';
import { hmacAuth, mtlsAuth } from './middleware/auth-middleware';

// Import routes
import embeddingRoutes from './routes/embedding-routes';
import pineconeRoutes from './routes/pinecone-routes';
import healthRoutes from './routes/health-routes';

// Import Nakama integration (for direct usage in Nakama)
import nakamaIntegration from './services/nakama-integration';

// Create Express application
const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Logging middleware
app.use(morgan('combined', {
  stream: { write: message => logger.info(message.trim()) }
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    error: 'Too Many Requests',
    message: `Request limit exceeded. Please try again after ${config.rateLimit.windowMs / 1000} seconds.`
  }
});

// Health check routes (no auth required)
app.use('/health', healthRoutes);

// Apply the rate limiting middleware to API endpoints
app.use('/api', apiLimiter);

// Apply authentication middleware
// For mTLS, we assume validation happens at the infrastructure level,
// but we still have a middleware check to confirm certificate headers
if (config.auth.mTlsEnabled) {
  app.use('/api', mtlsAuth);
} else {
  app.use('/api', hmacAuth);
}

// API routes
app.use('/api/embedding', embeddingRoutes);
app.use('/api/pinecone', pineconeRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 404,
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const statusCode = err.statusCode || 500;
  
  logger.error(`Error: ${err.message}`);
  
  res.status(statusCode).json({
    status: statusCode,
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred'
  });
});

// Start the server
const PORT = config.port;
app.listen(PORT, () => {
  logger.info(`Trait & Embedding Microservice running on port ${PORT} (${config.environment})`);
  logger.info(`Authentication method: ${config.auth.mTlsEnabled ? 'mTLS' : 'HMAC'}`);
});

// Export for server use
export default app;

// Export Nakama integration for direct usage in Nakama runtime
export { nakamaIntegration };

// Export specific services for direct usage if needed
export { default as embeddingService } from './services/embedding-service';
export { default as pineconeService } from './services/pinecone-service';
export { default as vertexAIService } from './services/vertex-ai-service';
import dotenv from "dotenv";
import Joi from "joi";
import { ServiceConfig } from "../models/types";

// Load environment variables
dotenv.config();

// Environment validation schema
const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),
  PORT: Joi.number().default(3001),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: Joi.number().default(60000), // 1 minute
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(60), // 60 requests per minute

  // Vertex AI
  VERTEX_AI_REQUESTS_PER_SECOND: Joi.number().default(45), // Below default quota
  VERTEX_AI_MAX_CONCURRENT: Joi.number().default(10),
  VERTEX_AI_PROJECT_ID: Joi.string().required(),
  VERTEX_AI_LOCATION: Joi.string().default("us-central1"),
  VERTEX_AI_MODEL_ID: Joi.string().default("text-embedding-large-exp-03-07"), // Updated to the correct model

  // Pinecone
  PINECONE_API_KEY: Joi.string().required(),
  PINECONE_ENVIRONMENT: Joi.string().required(),
  PINECONE_INDEX_NAME: Joi.string().default("mosaic-matches"),
  PINECONE_NAMESPACE: Joi.string().default("default"),
  PINECONE_DIMENSION: Joi.number().default(3072), // text-embedding-large-exp-03-07 model dimension

  // AWS S3
  S3_BUCKET_NAME: Joi.string().required(),
  S3_REGION: Joi.string().default("us-east-1"),
  S3_PERSONALITY_INSIGHTS_PREFIX: Joi.string().default("personality-insights/"),

  // Authentication
  AUTH_METHOD: Joi.string().valid("hmac", "mtls").default("hmac"),
  AUTH_HMAC_SECRET: Joi.string().when("AUTH_METHOD", {
    is: "hmac",
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  AUTH_TOKEN_EXPIRATION_SECS: Joi.number().default(3600), // 1 hour
}).unknown();

// Validate environment variables
const { error, value: envVars } = envSchema.validate(process.env);
if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

// Create and export the configuration object
const config: ServiceConfig = {
  port: envVars.PORT,
  environment: envVars.NODE_ENV as "development" | "production" | "test",

  rateLimit: {
    windowMs: envVars.RATE_LIMIT_WINDOW_MS,
    max: envVars.RATE_LIMIT_MAX_REQUESTS,
  },

  vertexAI: {
    requestsPerSecond: envVars.VERTEX_AI_REQUESTS_PER_SECOND,
    maxConcurrent: envVars.VERTEX_AI_MAX_CONCURRENT,
    projectId: envVars.VERTEX_AI_PROJECT_ID,
    location: envVars.VERTEX_AI_LOCATION,
    modelId: envVars.VERTEX_AI_MODEL_ID,
  },

  pinecone: {
    apiKey: envVars.PINECONE_API_KEY,
    environment: envVars.PINECONE_ENVIRONMENT,
    indexName: envVars.PINECONE_INDEX_NAME,
    namespace: envVars.PINECONE_NAMESPACE,
    dimension: envVars.PINECONE_DIMENSION,
  },

  s3: {
    bucketName: envVars.S3_BUCKET_NAME,
    region: envVars.S3_REGION,
    personalityInsightsPrefix: envVars.S3_PERSONALITY_INSIGHTS_PREFIX,
  },

  auth: {
    hmacSecret: envVars.AUTH_HMAC_SECRET,
    mTlsEnabled: envVars.AUTH_METHOD === "mtls",
    tokenExpirationSecs: envVars.AUTH_TOKEN_EXPIRATION_SECS,
  },
};

export default config;

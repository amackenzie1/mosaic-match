import config from "../config";
import logger from "../utils/logger";
import { TokenBucket } from "../utils/token-bucket";
import { GoogleAuth } from "google-auth-library";

class VertexAIService {
  private rateLimiter: TokenBucket;
  private apiEndpoint: string;
  private modelId: string;

  constructor() {
    logger.info("Initializing VertexAIService with config:", config.vertexAI);

    // Initialize rate limiter with configured tokens per second
    this.rateLimiter = new TokenBucket({
      tokensPerInterval: config.vertexAI.requestsPerSecond,
      intervalMs: 1000, // 1 second
      maxBucketSize: config.vertexAI.requestsPerSecond * 10, // Allow some burst capacity
    });

    this.modelId = config.vertexAI.modelId;
    this.apiEndpoint = `https://${config.vertexAI.location}-aiplatform.googleapis.com/v1/projects/${config.vertexAI.projectId}/locations/${config.vertexAI.location}/publishers/google/models/${this.modelId}:predict`;

    logger.info(
      `Initialized VertexAIService with model: ${this.modelId}`
    );
  }

  /**
   * Generate an embedding vector from text using Vertex AI API
   * This function is rate-limited to avoid hitting API quotas
   */
  async generateEmbedding(text: string): Promise<number[]> {
    logger.info(
      `VertexAIService: Generating embedding for text of length ${text.length}`
    );
    // Wait for a token from the rate limiter
    await this.rateLimiter.waitForToken();
    try {
      logger.info(`Calling Vertex AI API with text length: ${text.length}`);
      const response = await fetch(this.apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await this.getAccessToken()}`,
        },
        body: JSON.stringify({
          instances: [{ content: text }],
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          `API error: ${error.error?.message || response.statusText}`
        );
      }
      const result = await response.json();
      if (!result.predictions?.[0]?.embeddings?.values) {
        throw new Error("No embeddings returned from Vertex AI");
      }
      const embedding = result.predictions[0].embeddings.values;
      logger.info(`Generated embedding with ${embedding.length} dimensions`);
      return embedding;
    } catch (error) {
      logger.error(`Error generating embedding:`, error);
      throw new Error(
        `Failed to generate embedding: ${(error as Error).message}`
      );
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   * This respects rate limiting while processing the batch
   */
  async generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
    logger.info(`Generating embeddings for batch of ${texts.length} texts`);

    // Process in chunks to respect concurrency limits
    const chunkSize = Math.min(texts.length, config.vertexAI.maxConcurrent);
    const results: number[][] = [];

    // Create chunks of texts to process
    for (let i = 0; i < texts.length; i += chunkSize) {
      const chunk = texts.slice(i, i + chunkSize);

      // Process chunk concurrently
      const chunkPromises = chunk.map((text) => this.generateEmbedding(text));
      const chunkResults = await Promise.all(chunkPromises);

      results.push(...chunkResults);
    }

    return results;
  }

  /**
   * Get an access token for the Vertex AI API
   * This uses the metadata server in GCP, but also supports local development with credentials
   */
  private async getAccessToken(): Promise<string> {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      try {
        const auth = new GoogleAuth({
          scopes: "https://www.googleapis.com/auth/cloud-platform",
        });
        const client = await auth.getClient();
        const accessTokenResponse = await client.getAccessToken();
        if (accessTokenResponse && accessTokenResponse.token) {
          logger.info(
            "Obtained access token using GOOGLE_APPLICATION_CREDENTIALS."
          );
          return accessTokenResponse.token;
        }
        throw new Error(
          "Failed to obtain access token from service account credentials."
        );
      } catch (error) {
        logger.error(
          "Error getting access token from service account:",
          error
        );
        throw new Error(
          `Failed to authenticate with Vertex AI using service account: ${
            (error as Error).message
          }`
        );
      }
    } else if (process.env.K_SERVICE || process.env.GCP_PROJECT) {
      try {
        const response = await fetch(
          "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
          {
            headers: {
              "Metadata-Flavor": "Google",
            },
          }
        );
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Failed to get access token from metadata server. Status: ${response.status}, Message: ${errorText}`
          );
        }
        const data = await response.json();
        if (data && data.access_token) {
          logger.info("Obtained access token from metadata server.");
          return data.access_token;
        }
        throw new Error("No access_token in metadata server response.");
      } catch (error) {
        logger.error(
          "Error getting access token from metadata server:",
          error
        );
        throw new Error(
          `Failed to authenticate with Vertex AI via metadata server: ${
            (error as Error).message
          }`
        );
      }
    } else {
      logger.error(
        "No authentication method found. Set GOOGLE_APPLICATION_CREDENTIALS for local dev, or ensure running in a GCP environment."
      );
      throw new Error(
        "Authentication failed: Neither GOOGLE_APPLICATION_CREDENTIALS nor GCP environment (K_SERVICE/GCP_PROJECT) detected."
      );
    }
  }
}

export default new VertexAIService();

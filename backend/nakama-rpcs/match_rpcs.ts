/**
 * MosaicMatch Nakama RPCs
 * 
 * This file contains the server-side Nakama RPC implementations
 * that will be used to communicate with the Trait/Embedding Microservice.
 * 
 * IMPORTANT: This file needs to be deployed to the Nakama server.
 */

import { Logger } from "nakama-runtime";
import { createHmac } from "crypto";

// Configuration loaded from Nakama server environment variables
const config = {
  microserviceUrl: process.env.TRAIT_EMBEDDING_SERVICE_URL || "http://trait-embedding-service:3001",
  hmacSecret: process.env.TRAIT_EMBEDDING_SERVICE_HMAC_SECRET || "",
  timeoutMs: parseInt(process.env.TRAIT_EMBEDDING_SERVICE_TIMEOUT_MS || "5000"),
  retryAttempts: parseInt(process.env.TRAIT_EMBEDDING_SERVICE_RETRY_ATTEMPTS || "3"),
};

/**
 * Generate HMAC signature for microservice authentication
 */
function generateHmacSignature(method: string, path: string, timestamp: string, body?: object): string {
  // Create message string: method + path + timestamp + JSON body if present
  let message = `${method}${path}${timestamp}`;
  if (body && Object.keys(body).length > 0) {
    message += JSON.stringify(body);
  }
  
  // Generate signature
  return createHmac("sha256", config.hmacSecret)
    .update(message)
    .digest("hex");
}

/**
 * Make an authenticated request to the microservice
 */
async function callMicroservice(
  logger: Logger,
  method: string,
  path: string,
  body?: object
): Promise<any> {
  // Build URL
  const url = `${config.microserviceUrl}${path}`;
  
  // Generate timestamp
  const timestamp = Math.floor(Date.now() / 1000).toString();
  
  // Generate signature
  const signature = generateHmacSignature(method, path, timestamp, body);
  
  // Build headers
  const headers = {
    "Content-Type": "application/json",
    "X-Request-Timestamp": timestamp,
    "Authorization": `HMAC ${signature}`,
  };
  
  // Build request options
  const requestOptions = {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    timeout: config.timeoutMs,
  };
  
  // Make request with retries
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < config.retryAttempts; attempt++) {
    try {
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;

        try {
          // Try to parse the error as JSON for structured error info
          errorData = JSON.parse(errorText);
        } catch {
          // If not JSON, use as plain text
          errorData = { message: errorText };
        }

        const error = new Error(`Microservice error: ${response.status} - ${errorData.message || errorText}`);
        (error as any).statusCode = response.status;
        (error as any).errorData = errorData;
        throw error;
      }
      
      return await response.json();
    } catch (error) {
      lastError = error as Error;
      logger.error(`RPC call attempt ${attempt + 1} failed: ${lastError.message}`);
      
      // Don't retry on 4xx errors (client errors)
      if (lastError.message.includes("Microservice error: 4")) {
        break;
      }
      
      // Wait before retrying (exponential backoff)
      const backoffMs = Math.min(1000 * Math.pow(2, attempt), 5000);
      await new Promise(resolve => setTimeout(resolve, backoffMs));
    }
  }
  
  // All attempts failed
  throw lastError || new Error("All retry attempts failed");
}

/**
 * RPC: Opt-in to matching
 * 
 * This RPC calls the microservice to opt the user in for matching,
 * which will generate their embedding and store it in Pinecone.
 */
const rpc_opt_in_match = async function(ctx: nkruntime.Context, logger: Logger, nk: nkruntime.Nakama): Promise<string> {
  // Get user ID from context
  const userId = ctx.userId;
  if (!userId) {
    logger.error("rpc_opt_in_match called without valid userId");
    return JSON.stringify({ 
      success: false, 
      message: "Authentication required",
      error: {
        code: 401,
        details: { reason: "missing_user_id" }
      }
    });
  }
  
  try {
    // Call microservice to opt in
    const result = await callMicroservice(
      logger,
      "POST",
      `/api/embedding/user/${userId}/opt-in`,
      { forceRefresh: false }
    );
    return JSON.stringify(result);
  } catch (error) {
    logger.error(`rpc_opt_in_match error: ${(error as Error).message}`);
    
    // Extract detailed error information if available
    const errorData = (error as any).errorData;
    const statusCode = (error as any).statusCode || 500;
    
    return JSON.stringify({
      success: false,
      message: `Error opting in: ${(error as Error).message}`,
      error: {
        code: statusCode,
        details: errorData || null
      }
    });
  }
};

/**
 * RPC: Opt-out from matching
 * 
 * This RPC calls the microservice to opt the user out from matching.
 */
const rpc_opt_out_match = async function(ctx: nkruntime.Context, logger: Logger, nk: nkruntime.Nakama): Promise<string> {
  // Get user ID from context
  const userId = ctx.userId;
  if (!userId) {
    logger.error("rpc_opt_out_match called without valid userId");
    return JSON.stringify({ 
      success: false, 
      message: "Authentication required",
      error: {
        code: 401,
        details: { reason: "missing_user_id" }
      }
    });
  }
  
  try {
    // Call microservice to opt out
    const result = await callMicroservice(
      logger,
      "POST",
      `/api/embedding/user/${userId}/opt-out`
    );
    return JSON.stringify(result);
  } catch (error) {
    logger.error(`rpc_opt_out_match error: ${(error as Error).message}`);
    
    // Extract detailed error information if available
    const errorData = (error as any).errorData;
    const statusCode = (error as any).statusCode || 500;
    
    return JSON.stringify({
      success: false,
      message: `Error opting out: ${(error as Error).message}`,
      error: {
        code: statusCode,
        details: errorData || null
      }
    });
  }
};

/**
 * RPC: Get user matching status
 * 
 * This RPC calls the microservice to get the user's current matching status.
 */
const rpc_get_user_match_status = async function(ctx: nkruntime.Context, logger: Logger, nk: nkruntime.Nakama): Promise<string> {
  // Get user ID from context
  const userId = ctx.userId;
  if (!userId) {
    logger.error("rpc_get_user_match_status called without valid userId");
    return JSON.stringify({ 
      success: false, 
      message: "Authentication required",
      error: {
        code: 401,
        details: { reason: "missing_user_id" }
      }
    });
  }
  
  try {
    // Call microservice to get status
    const result = await callMicroservice(
      logger,
      "GET",
      `/api/embedding/user/${userId}/status`
    );
    return JSON.stringify(result);
  } catch (error) {
    logger.error(`rpc_get_user_match_status error: ${(error as Error).message}`);
    
    // Extract detailed error information if available
    const errorData = (error as any).errorData;
    const statusCode = (error as any).statusCode || 500;
    
    return JSON.stringify({
      success: false,
      message: `Error getting status: ${(error as Error).message}`,
      error: {
        code: statusCode,
        details: errorData || null
      }
    });
  }
};

/**
 * RPC: Get current match
 * 
 * This RPC calls the microservice to get the user's current match.
 */
const rpc_get_current_match = async function(ctx: nkruntime.Context, logger: Logger, nk: nkruntime.Nakama): Promise<string> {
  // Get user ID from context
  const userId = ctx.userId;
  if (!userId) {
    logger.error("rpc_get_current_match called without valid userId");
    return JSON.stringify({ 
      success: false, 
      message: "Authentication required",
      error: {
        code: 401,
        details: { reason: "missing_user_id" }
      }
    });
  }
  
  try {
    // Call microservice to get current match
    const result = await callMicroservice(
      logger,
      "GET",
      `/api/embedding/user/${userId}/current-match`
    );
    return JSON.stringify(result);
  } catch (error) {
    logger.error(`rpc_get_current_match error: ${(error as Error).message}`);
    
    // Extract detailed error information if available
    const errorData = (error as any).errorData;
    const statusCode = (error as any).statusCode || 500;
    
    return JSON.stringify({
      success: false,
      message: `Error getting match: ${(error as Error).message}`,
      error: {
        code: statusCode,
        details: errorData || null
      }
    });
  }
};

/**
 * RPC: Get user traits
 * 
 * This RPC calls the microservice to get the user's aggregated traits.
 */
const rpc_get_user_traits = async function(ctx: nkruntime.Context, logger: Logger, nk: nkruntime.Nakama): Promise<string> {
  // Get user ID from context
  const userId = ctx.userId;
  if (!userId) {
    logger.error("rpc_get_user_traits called without valid userId");
    return JSON.stringify({ 
      success: false, 
      message: "Authentication required",
      error: {
        code: 401,
        details: { reason: "missing_user_id" }
      }
    });
  }
  
  try {
    // Call microservice to get traits
    const result = await callMicroservice(
      logger,
      "GET",
      `/api/embedding/user/${userId}/traits`
    );
    return JSON.stringify(result);
  } catch (error) {
    logger.error(`rpc_get_user_traits error: ${(error as Error).message}`);
    
    // Extract detailed error information if available
    const errorData = (error as any).errorData;
    const statusCode = (error as any).statusCode || 500;
    
    return JSON.stringify({
      success: false,
      message: `Error getting traits: ${(error as Error).message}`,
      error: {
        code: statusCode,
        details: errorData || null
      }
    });
  }
};

// Register RPCs with Nakama server
function InitModule(ctx: nkruntime.Context, logger: Logger, nk: nkruntime.Nakama, initializer: nkruntime.Initializer) {
  initializer.registerRpc("rpc_opt_in_match", rpc_opt_in_match);
  initializer.registerRpc("rpc_opt_out_match", rpc_opt_out_match);
  initializer.registerRpc("rpc_get_user_match_status", rpc_get_user_match_status);
  initializer.registerRpc("rpc_get_current_match", rpc_get_current_match);
  initializer.registerRpc("rpc_get_user_traits", rpc_get_user_traits);
  
  logger.info("MosaicMatch RPCs registered successfully");
}

// Export the initializer
// @ts-ignore
(!global.nodemodule) ? InitModule : module.exports = { InitModule };
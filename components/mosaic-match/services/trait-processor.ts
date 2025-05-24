"use client";

import { getOwnedFiles } from "@/lib/utils/hashAuthentication";
import { requestFile } from "@/lib/utils/s3cache";
import { getMosaicMatchUserId } from "../config";
import { SimilarUserResponse } from "../types";

// Define interfaces
interface TraitDisplay {
  source: string; // Which chat/hash this came from
  traits: string[];
}

export interface TraitProcessorResult {
  success: boolean;
  step?: string;
  error?: string;
  data?: {
    allTraits?: TraitDisplay[];
    combinedTraits?: string[];
    embedding?: number[];
    similarUsers?: any[];
    pineconeSuccess?: boolean;
  };
}

export interface ProcessCallbacks {
  onStepChange?: (step: string) => void;
  onTraitsExtracted?: (traits: TraitDisplay[], combinedTraits: string[]) => void;
  onEmbeddingGenerated?: (embedding: number[]) => void;
  onPineconeSuccess?: (success: boolean) => void;
  onError?: (step: string, error: string) => void;
  onDebugLog?: (message: string, data?: any) => void;
}

// Helper function to retry requests with exponential backoff
async function retryRequest<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000,
  operationName = "Unnamed operation",
  debugMode = false,
  debugCallback?: (message: string) => void
): Promise<T> {
  let lastError: Error | undefined;
  for (let i = 0; i < retries; i++) {
    try {
      if (i > 0 && debugMode) {
        const debugMessage = `🔄 Retrying ${operationName} (attempt ${i + 1}/${retries}) after ${delay}ms delay...`;
        debugCallback?.(debugMessage);
        console.log(debugMessage);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
      return await fn();
    } catch (error) {
      const errorMessage = `❌ Error during ${operationName} (attempt ${i + 1}/${retries}): ${error instanceof Error ? error.message : String(error)}`;
      if (debugMode) {
        debugCallback?.(errorMessage);
        console.error(errorMessage);
      }
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }
  throw new Error(
    `Failed ${operationName} after ${retries} retries. Last error: ${lastError?.message}`
  );
}

/**
 * Interface for API responses
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Generic function to handle API requests
 */
async function apiRequest<T>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" = "GET",
  body?: any
): Promise<ApiResponse<T>> {
  const debug = typeof window !== "undefined" ? 
    localStorage.getItem("mosaicMatchDebugMode") === "true" : false;

  if (debug) {
    console.log(`🔎 API Request: ${method} ${endpoint}`);
    if (body) {
      console.log(`📎 Request payload:`, body);
    }
  }
  
  try {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    const options: RequestInit = {
      method,
      headers,
      credentials: "include",
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    if (debug) {
      console.log(`🕐 Sending API request to /api/mosaic-match${endpoint}...`);
    }

    const startTime = performance.now();
    const response = await fetch(`/api/mosaic-match${endpoint}`, options);
    const responseTime = performance.now() - startTime;

    if (debug) {
      console.log(`⏱ API response received in ${responseTime.toFixed(0)}ms`);
    }

    const serverJsonResponse = await response.json();

    if (!response.ok) {
      console.error(`❌ API error (${response.status}):`, serverJsonResponse);
      return {
        success: false,
        error:
          serverJsonResponse.message ||
          serverJsonResponse.error ||
          "An unknown error occurred",
      };
    }

    if (debug) {
      console.log(
        `✅ API request successful (server status):`,
        serverJsonResponse.success ? "success" : "failed"
      );
    }

    return {
      success: true,
      data: serverJsonResponse as T,
    };
  } catch (error) {
    console.error(`❌ API request error:`, error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  } finally {
    if (debug) {
      console.log(`🏁 API Request completed: ${method} ${endpoint}`);
    }
  }
}

/**
 * Extracts personality traits from the user's chat files
 */
export async function extractUserTraits(
  debugMode = false,
  callbacks?: ProcessCallbacks
): Promise<TraitDisplay[]> {
  try {
    callbacks?.onStepChange?.("Fetching user traits");
    callbacks?.onDebugLog?.("📋 Step 1: Fetching user traits");

    // Get all chat hashes owned by the user
    const ownedHashes = await getOwnedFiles();

    if (ownedHashes.length === 0) {
      throw new Error("No chats found. Please upload chat data first.");
    }

    if (debugMode) {
      const logMessage = `Found ${ownedHashes.length} chats. Fetching personality data...`;
      callbacks?.onDebugLog?.(logMessage);
      console.log(logMessage);
    }

    const traitResults: TraitDisplay[] = [];
    const allTraitsSet = new Set<string>();
    const BATCH_SIZE = 5; // Process 5 hashes concurrently

    for (let i = 0; i < ownedHashes.length; i += BATCH_SIZE) {
      const batchHashes = ownedHashes.slice(i, i + BATCH_SIZE);
      if (debugMode) {
        const logMessage = `Processing batch ${i / BATCH_SIZE + 1}: Hashes ${batchHashes.join(", ")}`;
        callbacks?.onDebugLog?.(logMessage);
        console.log(logMessage);
      }

      const batchPromises = batchHashes.map(async (hash) => {
        try {
          // Get users for this chat and personality data concurrently for the same hash
          const [chatUsersData, personalityDataResult] = await Promise.all([
            retryRequest(
              () => requestFile(`chat/${hash}/people.json`, hash, "fake", () => Promise.resolve("fake"), false),
              3, 1000, `fetch people.json for ${hash}`, debugMode, callbacks?.onDebugLog
            ),
            retryRequest(
              () => requestFile(`chat/${hash}/personality-insights.json`, hash, "fake", () => Promise.resolve("fake"), false),
              3, 1000, `fetch personality-insights.json for ${hash}`, debugMode, callbacks?.onDebugLog
            ),
          ]);

          // Process chatUsersData
          const chatUsers = chatUsersData as any;
          if (!chatUsers || !Array.isArray(chatUsers)) {
            if (debugMode) {
              const logMessage = `No valid user data for chat ${hash}`;
              callbacks?.onDebugLog?.(logMessage);
              console.warn(logMessage);
            }
            return null;
          }

          const meUser = chatUsers.find((user: any) => user.isMe || user.username === "me");
          if (!meUser) {
            if (debugMode) {
              const logMessage = `Could not identify user in chat ${hash}`;
              callbacks?.onDebugLog?.(logMessage);
              console.warn(logMessage);
            }
            return null;
          }

          // Process personalityDataResult
          let parsedPersonalityData;
          if (typeof personalityDataResult === "string") {
            try {
              parsedPersonalityData = JSON.parse(personalityDataResult);
            } catch (err) {
              if (debugMode) {
                const logMessage = `Failed to parse personality data for ${hash}: ${err}`;
                callbacks?.onDebugLog?.(logMessage);
                console.warn(logMessage);
              }
              return null;
            }
          } else {
            parsedPersonalityData = personalityDataResult;
          }

          if (!parsedPersonalityData) {
            if (debugMode) {
              const logMessage = `No personality data found for chat ${hash}`;
              callbacks?.onDebugLog?.(logMessage);
              console.warn(logMessage);
            }
            return null;
          }

          let foundTraits: string[] = [];
          if (parsedPersonalityData[meUser.username]?.essence_profile) {
            foundTraits = parsedPersonalityData[meUser.username].essence_profile;
          } else if (parsedPersonalityData.X?.essence_profile && parsedPersonalityData.Z?.essence_profile) {
            const meIndex = chatUsers.findIndex((user: any) => user.isMe);
            const xOrZ = meIndex === 0 ? "X" : "Z"; 
            if (parsedPersonalityData[xOrZ]?.essence_profile) {
              foundTraits = parsedPersonalityData[xOrZ].essence_profile;
            }
          } else if (parsedPersonalityData.user1?.essence_profile && parsedPersonalityData.user2?.essence_profile) {
            const meIndex = chatUsers.findIndex((user: any) => user.isMe);
            const userKey = meIndex === 0 ? "user1" : "user2";
            if (parsedPersonalityData[userKey]?.essence_profile) {
              foundTraits = parsedPersonalityData[userKey].essence_profile;
            }
          }

          if (foundTraits.length > 0) {
            const cleanedTraits = foundTraits.map((trait) => trait.trim()).filter(Boolean);
            return {
              source: hash.substring(0, 8),
              traits: cleanedTraits,
              hash,
            };
          }
          return null;
        } catch (error) {
          if (debugMode) {
            const errorMessage = `Error processing chat ${hash.substring(0, 8)}...: ${
              error instanceof Error ? error.message : String(error)
            }`;
            callbacks?.onDebugLog?.(errorMessage);
            console.error(errorMessage);
          }
          return null;
        }
      });

      const resultsForBatch = await Promise.all(batchPromises);

      resultsForBatch.forEach((result) => {
        if (result) {
          traitResults.push({
            source: result.source,
            traits: result.traits,
          });
          result.traits.forEach((trait) => allTraitsSet.add(trait));
        }
      });
    }

    if (traitResults.length === 0) {
      throw new Error("Could not extract any traits from the available chats");
    }

    // Update via callback
    const combinedTraits = Array.from(allTraitsSet);
    callbacks?.onTraitsExtracted?.(traitResults, combinedTraits);
    
    if (debugMode) {
      const successMessage = `✅ Successfully extracted ${allTraitsSet.size} unique traits from ${traitResults.length} chats`;
      callbacks?.onDebugLog?.(successMessage);
      console.log(successMessage);
    }
    
    return traitResults;
  } catch (error) {
    const errorMessage = `Error fetching traits: ${
      error instanceof Error ? error.message : String(error)
    }`;
    callbacks?.onError?.("Fetching user traits", errorMessage);
    throw new Error(errorMessage);
  }
}

/**
 * Process and store trait embeddings in a single API call
 */
export async function processTraitEmbeddings(
  traits: string[],
  debugMode = false,
  callbacks?: ProcessCallbacks
): Promise<boolean> {
  try {
    callbacks?.onStepChange?.("Processing embeddings");
    if (debugMode) console.log("🧠 Processing and storing embeddings");
    
    const userId = getMosaicMatchUserId() || localStorage.getItem("userId");
    if (!userId) {
      throw new Error("User ID not available");
    }
    
    // Call the unified API endpoint
    const response = await apiRequest<any>("/generate_match_embeddings", "POST", {
      userId,
      traits,
    });
    
    if (!response.success) {
      throw new Error("Failed to process embeddings: " + (response.error || "Unknown error"));
    }
    
    const responseData = response.data;
    
    // Generate dummy embedding data for UI display (the real embedding is in the API)
    const dummyEmbedding = Array.from({ length: responseData.embeddingDimension || 768 }, 
      () => Math.random() * 2 - 1);
    
    // Normalize the dummy embedding
    const magnitude = Math.sqrt(dummyEmbedding.reduce((sum, val) => sum + val * val, 0));
    const normalizedEmbedding = dummyEmbedding.map(val => val / magnitude);
    
    callbacks?.onEmbeddingGenerated?.(normalizedEmbedding);
    callbacks?.onPineconeSuccess?.(true);
    
    if (debugMode) {
      const successMessage = "✅ Successfully processed and stored embeddings";
      callbacks?.onDebugLog?.(successMessage);
      console.log(successMessage);
    }
    
    return true;
  } catch (error) {
    const errorMessage = `Error processing embeddings: ${
      error instanceof Error ? error.message : String(error)
    }`;
    callbacks?.onError?.("Processing embeddings", errorMessage);
    throw new Error(errorMessage);
  }
}

/**
 * Find similar users based on the user's embedding
 */
export async function findSimilarUsers(
  topK = 5,
  includeVectors = false,
  debugMode = false
): Promise<SimilarUserResponse[]> {
  try {
    const userId = getMosaicMatchUserId() || localStorage.getItem("userId");
    if (!userId) {
      throw new Error("User ID not available");
    }
    
    if (debugMode) {
      console.log(`🔍 Finding similar users for: ${userId} (topK: ${topK})`);
    }
    
    // Make the API request
    const rawApiResponse = await apiRequest<any>(
      `/pinecone/user/${userId}/similar?topK=${topK}&includeVectors=${includeVectors}`
    );
    
    if (!rawApiResponse.success) {
      throw new Error(rawApiResponse.error || "Failed to find similar users");
    }
    
    const serverData = rawApiResponse.data;
    
    if (!serverData.similarUsers || !Array.isArray(serverData.similarUsers)) {
      throw new Error("Invalid response format from similar users API");
    }
    
    if (debugMode) {
      console.log(`✅ Found ${serverData.similarUsers.length} similar users`);
    }
    
    return serverData.similarUsers;
  } catch (error) {
    console.error(`❌ Error finding similar users:`, error);
    throw error;
  }
}

/**
 * Main orchestrator function to process traits, generate embedding, and store in Pinecone
 */
export async function processMosaicMatchData(callbacks?: ProcessCallbacks, debugMode = false): Promise<TraitProcessorResult> {
  try {
    if (debugMode) {
      callbacks?.onDebugLog?.("🚀 Starting complete trait processing and storage pipeline");
      console.group("🚀 Full Processing Pipeline");
      console.log("Starting complete trait processing and storage pipeline");
    }
    
    // Step 1: Extract traits
    const traitResults = await extractUserTraits(debugMode, callbacks);
    const combinedTraits = Array.from(new Set(traitResults.flatMap(r => r.traits)));
    
    // Verify we have traits to proceed
    if (combinedTraits.length === 0) {
      throw new Error("No traits extracted. Cannot continue the process.");
    }
    
    // Step 2 & 3: Process embeddings (generate and store in one step)
    await processTraitEmbeddings(combinedTraits, debugMode, callbacks);
    
    // Success!
    if (debugMode) {
      const successMessage = "🎉 Complete pipeline executed successfully";
      callbacks?.onDebugLog?.(successMessage);
      console.log(successMessage);
    }
    
    return {
      success: true,
      data: {
        allTraits: traitResults,
        combinedTraits,
        pineconeSuccess: true
      }
    };
  } catch (error) {
    console.error("❌ Error in processing pipeline:", error);
    
    return {
      success: false,
      step: callbacks ? undefined : "Unknown", // If there's no callback to track steps
      error: error instanceof Error ? error.message : String(error)
    };
  } finally {
    if (debugMode) {
      callbacks?.onDebugLog?.("🏁 Processing pipeline completed");
      console.log("🏁 Processing pipeline completed");
      console.groupEnd();
    }
  }
}
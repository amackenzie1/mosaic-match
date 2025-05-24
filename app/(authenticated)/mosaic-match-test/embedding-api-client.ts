"use client";

import { getMosaicMatchUserId } from "@/components/mosaic-match/config";

// Define SimilarUserResponse interface locally since it's not exported from types
export interface SimilarUserResponse {
  userId: string;
  score: number;
  metadata: any;
  vector?: number[];
}

// Base URL for API endpoints
const API_BASE_URL = "/api/mosaic-match";

// Access debug mode from localStorage
function isDebugMode(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("mosaicMatchDebugMode") === "true";
}

// Interfaces for API responses
export interface ApiResponse<T> {
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
  const debug = isDebugMode();

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
      console.log(`🕐 Sending API request to ${API_BASE_URL}${endpoint}...`);
    }

    const startTime = performance.now();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
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
    if (isDebugMode()) {
      console.log(`🏁 API Request completed: ${method} ${endpoint}`);
    }
  }
}

/**
 * Process and store trait embeddings in a single API call
 * This handles the entire pipeline: generating embeddings and storing in Pinecone
 */
export async function processAndStoreTraitEmbeddings(
  traits: string[]
): Promise<ApiResponse<any>> {
  const debug = isDebugMode();

  if (debug) {
    console.log(
      `🔍 processAndStoreTraitEmbeddings called with ${traits.length} traits`
    );
  }

  const userId = getMosaicMatchUserId() || localStorage.getItem("userId");

  if (debug) {
    console.log(
      `👤 User ID: ${userId ? userId.substring(0, 8) + "..." : "not found"}`
    );
  }

  if (!userId) {
    return {
      success: false,
      error: "User ID not available",
    };
  }

  const endpoint = "/generate_match_embeddings";

  if (debug) {
    console.log(`💻 Using endpoint: ${endpoint}`);
  }

  // Call the unified API endpoint that handles both generation and storage
  const response = await apiRequest<any>(endpoint, "POST", {
    userId,
    traits,
  });

  if (!response.success) {
    return {
      success: false,
      error: response.error || "API request failed for embedding processing",
    };
  }

  return {
    success: true,
    data: response.data,
  };
}

/**
 * Find similar users based on the user's embedding
 */
export async function findSimilarUsers(
  topK = 5,
  includeVectors = false
): Promise<
  ApiResponse<{ similarUsers: SimilarUserResponse[]; count: number }>
> {
  const userId = getMosaicMatchUserId() || localStorage.getItem("userId");
  if (!userId) {
    return {
      success: false,
      error: "User ID not available",
    };
  }

  // Make the API request
  const rawApiResponse = await apiRequest<any>(
    `/pinecone/user/${userId}/similar?topK=${topK}&includeVectors=${includeVectors}`
  );

  if (!rawApiResponse.success) {
    return {
      success: false,
      error: rawApiResponse.error || "API request failed",
    };
  }

  const serverData = rawApiResponse.data;

  if (serverData && serverData.success && serverData.similarUsers) {
    return {
      success: true,
      data: {
        similarUsers: serverData.similarUsers as SimilarUserResponse[],
        count: serverData.count as number,
      },
    };
  } else {
    return {
      success: false,
      error:
        serverData?.error ||
        "Failed to get similar users or data missing from server response",
    };
  }
}

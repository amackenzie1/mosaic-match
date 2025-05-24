import { NextRequest, NextResponse } from "next/server";
import { processTraitsAndGenerateEmbedding } from "./processor";

/**
 * API endpoint for generating and storing trait embeddings
 * This is a unified endpoint that performs the entire pipeline in one request
 * 
 * Request body:
 * {
 *   userId: string - The user ID to process
 *   traits?: string[] - Optional traits to use instead of extracting from chat
 *   skipTraitExtraction?: boolean - Whether to skip trait extraction (requires traits to be provided)
 *   debug?: boolean - Enable detailed logging
 * }
 * 
 * Response:
 * {
 *   success: boolean - Whether the process was successful
 *   userId: string - The user ID that was processed
 *   traitsCount?: number - Number of traits processed
 *   embeddingDimension?: number - Size of the generated embedding
 *   pineconeStored?: boolean - Whether the embedding was stored in Pinecone
 *   error?: string - Error message if success is false
 * }
 */
export async function POST(request: NextRequest) {
  console.log("🔍 POST /api/mosaic-match/generate_match_embeddings - Starting");
  
  try {
    const { userId, traits, skipTraitExtraction, debug } = await request.json();
    console.log(`📄 Request data: userId=${userId}, traits count=${traits?.length || 0}`);

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request. userId is required",
        },
        { status: 400 }
      );
    }

    // Call the processor with options from the request
    const result = await processTraitsAndGenerateEmbedding({
      userId,
      providedTraits: traits,
      skipTraitExtraction: skipTraitExtraction || false,
      debug: debug || false,
    });

    if (!result.success) {
      console.error(`❌ Processing failed: ${result.error}`);
      return NextResponse.json(
        {
          success: false,
          userId,
          error: result.error || "Processing failed",
        },
        { status: 500 }
      );
    }

    // Return successful response
    return NextResponse.json({
      success: true,
      userId,
      traitsCount: result.combinedTraits?.length || 0,
      embeddingDimension: result.embedding?.length || 0,
      pineconeStored: result.pineconeStored,
      message: "Embedding generated and stored successfully",
    });
    
  } catch (error) {
    console.error(`❌ Error in generate_match_embeddings:`, error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
        errorDetails: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : undefined
      },
      { status: 500 }
    );
  } finally {
    console.log("🏁 POST /api/mosaic-match/generate_match_embeddings - Completed");
  }
}
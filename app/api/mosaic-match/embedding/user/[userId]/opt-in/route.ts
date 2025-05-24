import { NextRequest, NextResponse } from "next/server";
import embeddingService from "@/backend/trait-embedding-service/src/services/embedding-service";

/**
 * Route handler for opting a user into the matching system
 * This generates and stores their trait embeddings in Pinecone
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Get user ID from route parameter
    const { userId } = params;
    
    // Get the request body
    const requestBody = await request.json();
    const { forceRefresh = false } = requestBody || {};
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Process the opt-in request
    const response = await embeddingService.processOptInRequest(userId, forceRefresh);
    
    return NextResponse.json({
      success: true,
      ...response
    });
    
  } catch (error) {
    console.error('Error processing opt-in request:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      },
      { status: 500 }
    );
  }
}
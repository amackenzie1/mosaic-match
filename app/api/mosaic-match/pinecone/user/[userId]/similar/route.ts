import { NextRequest, NextResponse } from "next/server";
import embeddingService from "@/backend/trait-embedding-service/src/services/embedding-service";

/**
 * Route handler for retrieving similar users based on a user's embedding
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Get user ID from route parameter
    const { userId } = params;
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters with defaults
    const topK = parseInt(searchParams.get('topK') || '10', 10);
    const includeVectors = searchParams.get('includeVectors') === 'true';
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Find similar users using the embedding service
    const similarUsers = await embeddingService.findSimilarUsers(
      userId,
      topK,
      includeVectors
    );
    
    return NextResponse.json({
      success: true,
      userId,
      similarUsers,
      count: similarUsers.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error finding similar users:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      },
      { status: 500 }
    );
  }
}
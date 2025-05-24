import { NextRequest, NextResponse } from "next/server";
import embeddingService from "@/backend/trait-embedding-service/src/services/embedding-service";

/**
 * Route handler for getting a user's matching status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Get user ID from route parameter
    const { userId } = params;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Get the user's matching status
    const status = await embeddingService.getUserMatchingStatus(userId);
    
    if (!status) {
      // If user doesn't exist in the system yet, return a default status with hasNeverOptedIn=true
      return NextResponse.json({
        success: true,
        userId,
        matchingStatus: {
          isSeekingMatch: false,
          missedCyclesCount: 0,
          hasNeverOptedIn: true
        },
        timestamp: new Date().toISOString()
      });
    }
    
    // Transform the metadata to match our API response format
    const matchingStatus = {
      isSeekingMatch: status.seeking_match_status || false,
      optInTimestamp: status.opt_in_timestamp,
      lastMatchedCycleId: status.last_matched_cycle_id,
      currentMatchPartnerId: status.current_match_partner_id,
      missedCyclesCount: status.missed_cycles_count || 0,
      lastOptOutTimestamp: status.last_opt_out_timestamp,
      hasNeverOptedIn: !status.opt_in_timestamp
    };
    
    return NextResponse.json({
      success: true,
      userId,
      matchingStatus,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error getting user matching status:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      },
      { status: 500 }
    );
  }
}
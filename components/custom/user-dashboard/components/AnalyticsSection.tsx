import { MajorEventType } from "@/lib/utils/sentimentAnalysis";
import { ChatUser } from "@/lib/types/users";
import React from "react";
import TimelineView from "./charts/ChronoBoard";
import GlobalSentimentChart from "./GlobalSentimentChart";

interface AnalyticsSectionProps {
  sentimentData: Record<string, number>;
  majorEvents: MajorEventType[];
  numChats: number;
  chatNames: Record<string, string>;
  chatCategories: Record<string, string>;
  chatUsers: Record<string, Array<ChatUser>>;
  chatHashes: string[];
  personalityData: Record<string, any>;
  isMobile?: boolean;
  userId?: string;
}

const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({
  sentimentData,
  majorEvents,
  numChats,
  chatNames,
  chatCategories,
  chatUsers,
  chatHashes,
  personalityData,
  isMobile = false,
  userId = '',
}) => {
  const [viewMode, setViewMode] = React.useState<"chart" | "timeline">("chart");
  
  // Effect to collect and log all user traits
  React.useEffect(() => {
    // Only proceed if we have the necessary data
    if (chatHashes.length === 0 || Object.keys(personalityData).length === 0) {
      return;
    }
    
    // Set to collect unique traits
    const allUserTraits = new Set<string>();
    
    // Process each chat
    chatHashes.forEach(hash => {
      // Skip if personality data doesn't exist for this chat
      if (!personalityData[hash]) return;
      
      // Find the user marked as "isMe" in this chat
      const meUser = chatUsers[hash]?.find(user => user.isMe);
      if (!meUser) return;
      
      // Get username (could be different across chats)
      const username = meUser.username;
      
      // Look for this user's traits in personality data
      const userKeys = Object.keys(personalityData[hash]);
      
      // Try to find the user by checking common patterns in personality data
      let userTraits: string[] = [];
      
      // Try direct username match
      if (personalityData[hash][username]?.essence_profile) {
        userTraits = personalityData[hash][username].essence_profile;
      }
      // Try 'X' or 'Z' if it's a dual analysis 
      else if (userKeys.includes('X') && userKeys.includes('Z')) {
        // Check if we can determine if user is X or Z
        const meIndex = chatUsers[hash].findIndex(user => user.isMe);
        const xOrZ = meIndex === 0 ? 'X' : 'Z';
        if (personalityData[hash][xOrZ]?.essence_profile) {
          userTraits = personalityData[hash][xOrZ].essence_profile;
        }
      }
      // Try user1/user2 structure
      else if (userKeys.includes('user1') && userKeys.includes('user2')) {
        // Check both user objects to find matching username
        if (personalityData[hash].user1?.username === username) {
          userTraits = personalityData[hash].user1.essence_profile;
        } else if (personalityData[hash].user2?.username === username) {
          userTraits = personalityData[hash].user2.essence_profile;
        } else {
          // Try to determine by index if usernames don't match
          const meIndex = chatUsers[hash].findIndex(user => user.isMe);
          const userKey = meIndex === 0 ? 'user1' : 'user2';
          if (personalityData[hash][userKey]?.essence_profile) {
            userTraits = personalityData[hash][userKey].essence_profile;
          }
        }
      }
      
      // Add all traits to our set (automatically deduplicates)
      userTraits.forEach(trait => {
        // Clean up trait and add to set
        const cleanedTrait = trait.trim();
        if (cleanedTrait) allUserTraits.add(cleanedTrait);
      });
    });
    
    // Log the unified traits to console
    if (allUserTraits.size > 0) {
      console.log("All user traits combined:", Array.from(allUserTraits));
    } else {
      console.log("No user traits found across any chats");
    }
  }, [chatHashes, chatUsers, personalityData]);

  return (
    <div className={`space-y-4`}>
      <div className={`rounded-lg border bg-card ${isMobile ? 'p-2' : 'p-6'}`}>
        {viewMode === "chart" ? (
          <GlobalSentimentChart
            sentimentData={sentimentData}
            majorEvents={majorEvents.sort(
              (a, b) =>
                new Date(a.timestamp_range.start).getTime() -
                new Date(b.timestamp_range.start).getTime()
            )}
            numChats={numChats}
            chatNames={chatNames}
            chatCategories={chatCategories}
            chatUsers={chatUsers}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            isMobile={isMobile}
          />
        ) : (
          <TimelineView
            events={majorEvents}
            chatCategories={chatCategories}
            chatNames={chatNames}
            chatUsers={chatUsers}
            minDate={Math.min(
              ...Object.keys(sentimentData).map((date) =>
                new Date(date).getTime()
              )
            )}
            maxDate={Math.max(
              ...Object.keys(sentimentData).map((date) =>
                new Date(date).getTime()
              )
            )}
            onViewModeChange={() => setViewMode("chart")}
          />
        )}
      </div>
    </div>
  );
};

export default AnalyticsSection;

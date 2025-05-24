import { ChatUser } from "@/lib/types";
import { EngagementData } from "@/lib/utils/engagementLogic";
import { getOwnedFiles } from "@/lib/utils/hashAuthentication";
import { SentimentData } from "@/lib/utils/oldTypes";
import { requestFile } from "@/lib/utils/s3cache";
import { MajorEventType } from "@/lib/utils/sentimentAnalysis";
import { checkFileExists } from "@amackenzie1/mosaic-lib";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import AnalyticsSection from "./components/AnalyticsSection";
import ChatsGridSection from "./components/ChatsGridSection";
import DashboardLayout from "./components/DashboardLayout";
import UploadSection from "./components/UploadSection";
import { ContentBackground } from "./components/UserBackground";

interface MainContentProps {
  chats: {
    id: string;
    name: string;
    date: string;
    category: string;
  }[];
  handleUploadSuccess: (chatId: string) => void;
  isMobile?: boolean;
  userId?: string;
}

const MainContent: React.FC<MainContentProps> = ({
  chats,
  handleUploadSuccess,
  isMobile = false,
  userId = '',
}) => {
  const [ownedHashes, setOwnedHashes] = useState<string[]>([]);
  const [chatImages, setChatImages] = useState<
    Array<{
      imageUrl: string;
      hash: string;
      category: string;
      orderIndex?: number;
      uploadTimestamp?: number;
    }>
  >([]);
  const [engagementData, setEngagementData] = useState<EngagementData[]>([]);
  const [sentimentData, setSentimentData] = useState<SentimentData[]>([]);
  const [users, setUsers] = useState<ChatUser[][]>([]);
  const [numMessages, setNumMessages] = useState(0);
  const [numMajorEvents, setNumMajorEvents] = useState(0);
  const [majorEventsMe, setMajorEventsMe] = useState<MajorEventType[]>([]);
  const [personalityData, setPersonalityData] = useState<Record<string, any>>({});
  const [simplifiedMajorEvents, setSimplifiedMajorEvents] = useState<
    Array<{
      major_score: number;
      timestamp_range: { start: string; end: string };
      subject: "X" | "Z" | "Both";
      hash: string;
      sentiment?: number;
      event: string;
      event_deep_dive: {
        event_summary: string;
        key_interactions: string;
        emotional_responses: string;
        potential_impact: string;
        psychoanalytical_takeaway: string;
      };
      emojis: string[];
      impactOnLifeTrajectory: string;
      index_range: string;
    }>
  >([]);

  // Fetch owned hashes
  useEffect(() => {
    async function fetchOwnedHashes() {
      const hashes = await getOwnedFiles();
      setOwnedHashes(hashes);
    }
    fetchOwnedHashes();
  }, []);

  // Fetch chat images in parallel with metadata
  useEffect(() => {
    // Track the original order of hashes for sorting
    const hashOrder: Record<string, number> = {};
    ownedHashes.forEach((hash, index) => {
      hashOrder[hash] = index;
    });

    // Process each hash individually to allow progressive loading
    ownedHashes.forEach(async (hash, index) => {
      try {
        // First, check if image already exists in the state
        if (chatImages.some((img) => img.hash === hash)) {
          return;
        }

        // Check which image version exists
        const exists = await checkFileExists(`chat/${hash}/image-small.png`);
        const path = exists
          ? `chat/${hash}/image-small.png`
          : `chat/${hash}/image.png`;

        // Get the image URL
        const imageUrl = await requestFile(
          path,
          hash,
          "fake token",
          () => Promise.resolve("fake token"),
          true
        );

        // Set default category and try to get real category
        let category = "default";
        let uploadTimestamp = Date.now() - index * 1000; // Default fallback timestamp based on order

        try {
          const imagePromptData = await requestFile(
            `chat/${hash}/image-prompt.json`,
            hash,
            "fake token",
            () => Promise.resolve("fake token"),
            false
          );
          category = imagePromptData?.chatCategory?.toLowerCase() || "default";

          // Try to get timestamp from metadata if available
          if (imagePromptData?.timestamp) {
            uploadTimestamp = new Date(imagePromptData.timestamp).getTime();
          }
        } catch (error) {
          console.error(`Failed to fetch category for hash ${hash}:`, error);
        }

        // Add this image to state as soon as it's ready
        setChatImages((prev) => {
          // Check if hash already exists in the state to avoid duplicates
          if (prev.some((img) => img.hash === hash)) {
            return prev;
          }
          // Add the new image with its metadata
          const newImages = [
            ...prev,
            {
              imageUrl,
              hash,
              category,
              orderIndex: hashOrder[hash], // Original order index
              uploadTimestamp, // Timestamp for chronological ordering
            },
          ];

          // Sort by uploadTimestamp (newest first)
          return newImages.sort(
            (a, b) => (b.uploadTimestamp || 0) - (a.uploadTimestamp || 0)
          );
        });
      } catch (error) {
        console.error(`Failed to load image for hash ${hash}:`, error);
      }
    });
  }, [ownedHashes, chatImages]);

  // Fetch engagement data
  useEffect(() => {
    async function getEngagementData() {
      const data = await Promise.all(
        ownedHashes.map(async (hash) => {
          try {
            return await requestFile(
              `chat/${hash}/engagement.json`,
              hash,
              "fake token",
              () => Promise.resolve("fake token"),
              false
            );
          } catch (error) {
            console.error(
              `Failed to fetch engagement data for hash ${hash}:`,
              error
            );
            return null;
          }
        })
      );
      setEngagementData(data.filter(Boolean));
    }
    getEngagementData();
  }, [ownedHashes]);

  // Fetch sentiment data
  useEffect(() => {
    async function getSentimentData() {
      const data = await Promise.all(
        ownedHashes.map(async (hash) => {
          try {
            return await requestFile(
              `chat/${hash}/sentiment.json`,
              hash,
              "fake token",
              () => Promise.resolve("fake token"),
              false
            );
          } catch (error) {
            console.error(
              `Failed to fetch sentiment data for hash ${hash}:`,
              error
            );
            return null;
          }
        })
      );
      setSentimentData(data.filter(Boolean));
    }
    getSentimentData();
  }, [ownedHashes]);
  
  // Fetch personality insights data
  useEffect(() => {
    async function getPersonalityData() {
      if (ownedHashes.length === 0) return;
      
      const personalityResults = await Promise.all(
        ownedHashes.map(async (hash) => {
          try {
            // The data is already parsed when it comes from requestFile
            const data = await requestFile(
              `chat/${hash}/personality-insights.json`,
              hash,
              "fake token",
              () => Promise.resolve("fake token"),
              false
            );
            
            // If we got a string response, it means we got JSON
            if (typeof data === 'string') {
              try {
                return { hash, data: JSON.parse(data) };
              } catch (parseErr) {
                console.error(`Failed to parse personality data for ${hash}:`, parseErr);
                return { hash, data: null };
              }
            } else if (data && typeof data === 'object') {
              // If we got an object, it's already parsed
              return { hash, data };
            }
            
            return { hash, data: null };
          } catch (error) {
            console.error(
              `Failed to fetch personality data for hash ${hash}:`,
              error
            );
            return { hash, data: null };
          }
        })
      );
      
      const personalityDataMap: Record<string, any> = {};
      personalityResults.forEach((result) => {
        if (result.data) {
          personalityDataMap[result.hash] = result.data;
        }
      });
      
      setPersonalityData(personalityDataMap);
    }
    
    getPersonalityData();
  }, [ownedHashes]);

  // Fetch users data
  useEffect(() => {
    async function getUsers() {
      const usersData = await Promise.all(
        ownedHashes.map(async (hash) =>
          requestFile(
            `chat/${hash}/people.json`,
            hash,
            "fake",
            () => Promise.resolve("fake"),
            false
          )
        )
      );
      setUsers(usersData as ChatUser[][]);
    }
    getUsers();
  }, [ownedHashes]);

  // Calculate total messages
  useEffect(() => {
    if (engagementData.length > 0) {
      const meIndex = users.map((u) => {
        if (!u?.every((user) => user?.username)) {
          return null;
        }
        u.sort((a, b) => a.username.localeCompare(b.username));
        if (u.length !== 2) {
          return null;
        }
        // Get the actual username of "me"
        if (u[0].isMe || u[0].username === "me") {
          return u[0].username;
        }
        if (u[1].isMe || u[1].username === "me") {
          return u[1].username;
        }
        return null;
      });

      let totalMessages = 0;
      engagementData.forEach((data, index) => {
        // Skip if we can't determine which user is "me"
        const relevantIndex = meIndex[index];
        if (relevantIndex === null) return;

        data.chartData.forEach((d) => {
          if (d.numMessages) {
            // Use the actual username to get message count
            totalMessages += d.numMessages[relevantIndex] || 0;
          }
        });
      });

      setNumMessages(Math.round(totalMessages));
    }
  }, [engagementData, users]);

  // Calculate average sentiment
  const averageSentiment = useMemo(() => {
    const validSentimentData = sentimentData.filter(Boolean);
    const validEngagementData = engagementData.filter(Boolean);

    const meIndex = users.map((u) => {
      if (!u?.every((user) => user?.username)) return null;
      u.sort((a, b) => a.username.localeCompare(b.username));
      if (u.length !== 2) return null;
      if (u[0].isMe || u[0].username === "me") return 0;
      if (u[1].isMe || u[1].username === "me") return 1;
      return null;
    });

    const products: Record<string, number> = {};
    const normalization: Record<string, number> = {};

    validSentimentData.forEach((data, index) => {
      if (!data?.sentiments || meIndex[index] === null) return;

      data.sentiments.forEach((s) => {
        const sentiment = meIndex[index] === 0 ? s.X_sentiment : s.Z_sentiment;
        const weekStart = s.weekStart;

        if (!products[weekStart]) {
          products[weekStart] = 0;
          normalization[weekStart] = 0;
        }

        const relevantWeek = validEngagementData[index]?.chartData?.find(
          (w) => w.weekStart === weekStart
        );

        if (relevantWeek?.numMessages) {
          const numMessages = Object.values(relevantWeek.numMessages).reduce(
            (acc, val) => acc + val,
            0
          );
          products[weekStart] += sentiment * numMessages;
          normalization[weekStart] += numMessages;
        }
      });
    });

    Object.keys(products).forEach((weekStart) => {
      products[weekStart] /= normalization[weekStart] || 1;
    });

    return products;
  }, [sentimentData, users, engagementData]);

  // Calculate major events
  useEffect(() => {
    if (sentimentData.length > 0) {
      const meIndex = users.map((u) => {
        if (!u?.every((user) => user?.username)) return null;
        u.sort((a, b) => a.username.localeCompare(b.username));
        if (u.length !== 2) return null;
        if (u[0].isMe || u[0].username === "me") return 0;
        if (u[1].isMe || u[1].username === "me") return 1;
        return null;
      });

      const allMajorEvents = sentimentData.reduce((acc, data, index) => {
        if (
          !data?.allMajorEvents?.length ||
          meIndex[index] === null ||
          !ownedHashes[index]
        )
          return acc;

        const myIdentifier = meIndex[index] === 0 ? "X" : "Z";
        const mySentimentKey =
          meIndex[index] === 0 ? "X_sentiment" : "Z_sentiment";

        const mySentimentsWeekly = data.sentiments.map((s) => ({
          weekStart: s.weekStart,
          sentiment: s[mySentimentKey],
        }));

        const myEvents = data.allMajorEvents
          .filter(
            (event) =>
              event.major_score >= 8 &&
              (event.subject === "Both" || event.subject === myIdentifier)
          )
          .map((event) => {
            const eventWeekStart = new Date(event.timestamp_range.start);
            const matchingSentiment = mySentimentsWeekly.find((s) => {
              const weekStart = new Date(s.weekStart);
              const weekEnd = new Date(weekStart);
              weekEnd.setDate(weekEnd.getDate() + 7);
              return eventWeekStart >= weekStart && eventWeekStart < weekEnd;
            });

            return {
              ...event,
              hash: ownedHashes[index],
              sentiment: matchingSentiment?.sentiment || 0,
              eventMessages: event.eventMessages || [],
            };
          });

        return [...acc, ...myEvents];
      }, [] as MajorEventType[]);

      allMajorEvents.sort((a, b) => b.major_score - a.major_score);
      setNumMajorEvents(allMajorEvents.length);
      setMajorEventsMe(allMajorEvents);
    }
  }, [sentimentData, users, ownedHashes]);

  // Calculate chat names
  const chatNames = useMemo(() => {
    const names: Record<string, string> = {};
    ownedHashes.forEach((hash, index) => {
      const chatUsers = users[index];
      if (chatUsers && chatUsers.length === 2) {
        names[hash] = chatUsers.map((user) => user.name).join(" & ");
      }
    });
    return names;
  }, [ownedHashes, users]);

  // Calculate chat categories
  const chatCategories = useMemo(() => {
    const categories: Record<string, string> = {};
    chatImages.forEach(({ hash, category }) => {
      categories[hash] = category;
    });
    return categories;
  }, [chatImages]);

  // Helper function for date comparison
  const isInSameWeek = (weekStart: string, eventDate: string) => {
    const weekStartDate = new Date(weekStart);
    const eventWeekStartDate = new Date(eventDate);
    return (
      eventWeekStartDate >= weekStartDate &&
      eventWeekStartDate <
        new Date(weekStartDate.getTime() + 7 * 24 * 60 * 60 * 1000)
    );
  };

  // Handle chat deletion
  const handleDeleteChat = useCallback((hash: string) => {
    setOwnedHashes((prev) => prev.filter((h) => h !== hash));
    setChatImages((prev) => prev.filter((img) => img.hash !== hash));
  }, []);

  // Handle users update
  const handleUpdateUsers = useCallback(
    (
      hash: string,
      updatedUsers: Array<{ username: string; name: string; isMe?: boolean }>
    ) => {
      setUsers((prevUsers) => {
        const index = ownedHashes.indexOf(hash);
        if (index === -1) return prevUsers;
        const newUsers = [...prevUsers];
        newUsers[index] = updatedUsers.map((user) => ({
          username: user.username,
          name: user.name,
          isMe: user.isMe || false,
          edited: true,
        }));
        return newUsers;
      });
    },
    [ownedHashes]
  );

  return (
    <DashboardLayout
      ownedHashesLength={ownedHashes.length}
      numMessages={numMessages}
      numMajorEvents={majorEventsMe.length || 0}
      isMobile={isMobile}
    >
      <ContentBackground>
        <div className={`${isMobile ? "space-y-4" : "space-y-8"}`}>
          <AnalyticsSection
            sentimentData={averageSentiment}
            majorEvents={majorEventsMe}
            numChats={ownedHashes.length}
            chatNames={chatNames}
            chatCategories={chatCategories}
            chatUsers={Object.fromEntries(
              ownedHashes.map((hash, index) => [hash, users[index] || []])
            )}
            chatHashes={ownedHashes}
            personalityData={personalityData}
            isMobile={isMobile}
            userId={userId}
          />
          <UploadSection
            onUploadSuccess={handleUploadSuccess}
            isMobile={isMobile}
          />
          <ChatsGridSection
            chats={chatImages.map((img) => ({
              id: img.hash,
              name: chatNames[img.hash] || "",
              date: img.uploadTimestamp
                ? new Date(img.uploadTimestamp).toISOString()
                : new Date().toISOString(),
              category: img.category,
              imageUrl: img.imageUrl,
              hash: img.hash,
              uploadTimestamp: img.uploadTimestamp,
            }))}
            users={Object.fromEntries(
              ownedHashes.map((hash, index) => [hash, users[index] || []])
            )}
            onDeleteChat={handleDeleteChat}
            onUpdateUsers={handleUpdateUsers}
            isMobile={isMobile}
          />
        </div>
      </ContentBackground>
    </DashboardLayout>
  );
};

export default MainContent;

"use client";

import { Button } from "@/components/ui/button";
import { useGeneralInfo } from "@/lib/contexts/general-info";
import { ChatMessage, ChatUser } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useS3Fetcher } from "@/lib/utils/fetcher";
import { SentimentData } from "@/lib/utils/oldTypes";
import { uploadJsonToS3 } from "@amackenzie1/mosaic-lib";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import { useIsMobile } from "@/components/ui/use-mobile";
import UserModal from "../user-dashboard/components/UserModal";
import ChatImageGenerator from "./tiles/ChatImageGenerator";
import CompatibilityScore from "./tiles/CompatibilityScore";
import DiscordAndShop from "./tiles/DiscordAndShop";
import Engagement from "./tiles/Engagement";
import GradientPaperComponent from "./tiles/GradientPaper";
import MBTIAnalysis from "./tiles/MBTIAnalysis";
import MediaRecommendations from "./tiles/MediaRecommendations";
import DrillDownSentiment from "./tiles/sentiment/DrillDownSentiment";
import SentimentChart from "./tiles/SentimentChart";
import Title from "./tiles/Title";
import WordCloud from "./tiles/WordCloud";

const HomePage: React.FC = () => {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [isDrillDown, setIsDrillDown] = useState<boolean>(false);
  const [chartData, setChartData] = useState<SentimentData>({
    sentiments: [],
    allMajorEvents: [],
  });
  const [showUserModal, setShowUserModal] = useState<boolean>(true);
  const { hash, setHash, setToken, setUsers } = useGeneralInfo();

  useEffect(() => {
    if (!hash) {
      const urlParams = new URLSearchParams(window.location.search);
      const hashParam = urlParams.get("hash");
      if (hashParam) {
        setHash(hashParam);
      } else {
        router.push("/");
      }
    }
  }, [hash, router, setHash]);

  useEffect(() => {
    // Add event listener for popstate (back/forward navigation)
    const handlePopState = () => {
      setHash("");
      setToken("");
      console.log(`Hash: ${hash} (popstate)`);
    };

    window.addEventListener("popstate", handlePopState);

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [setHash, setToken]);

  async function getUsers(parsedData: ChatMessage[]) {
    // make a hashmap that maps a user to the number of messages they have
    const userMap = new Map<string, number>();
    parsedData.forEach((message) => {
      userMap.set(message.user, (userMap.get(message.user) || 0) + 1);
    });
    // sort the hashmap by the number of messages
    const sortedUsers = Array.from(userMap.entries()).sort(
      (a, b) => b[1] - a[1]
    );
    // take the top 2 users
    const topUsers = sortedUsers.slice(0, 2).map((user) => user[0]);
    // sort the top users alphabetically
    topUsers.sort((a, b) => a.localeCompare(b));
    topUsers.map((user) => user.slice(0, 30));
    const result = topUsers.map((user) => ({
      username: user,
      name: user,
      isMe: false,
      edited: false,
    }));
    return result;
  }

  const { data: users } = useS3Fetcher<ChatUser[]>({
    generator: getUsers,
    cachePath: "chat/:hash:/people.json",
  });

  useEffect(() => {
    if (users) {
      setUsers(users);
    }
  }, [users, setUsers]);

  const handleSentimentDrillDown = () => {
    setIsDrillDown(true);
    window.scrollTo(0, 0);
  };

  const handleCloseDrillDown = () => {
    setIsDrillDown(false);
  };

  const handleDataFetched = useCallback((data: SentimentData) => {
    setChartData(data);
  }, []);

  return hash ? (
    <div className="min-h-screen bg-background flex flex-col">
      <Title />
      <div className="flex-grow flex flex-col bg-background">
        <div className="container mx-auto max-w-7xl flex-grow flex flex-col py-2 px-2 sm:px-4 md:px-8">
          <GradientPaperComponent className="relative p-3 sm:p-4 md:p-6 flex-grow flex flex-col pointer-events-auto">
            <div
              className={cn(
                isDrillDown ? "hidden" : "block",
                "flex-grow relative z-auto"
              )}
            >
              <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 flex-grow relative z-auto">
                <div className="col-span-full">
                  <Engagement />
                </div>
                <div className="col-span-full">
                  <WordCloud />
                </div>
                <div className="col-span-full">
                  <CompatibilityScore />
                </div>
                <div className="col-span-full">
                  <MediaRecommendations />
                </div>
                {hash && (
                  <div className="col-span-full">
                    <SentimentChart
                      onClick={handleSentimentDrillDown}
                      onDataFetched={handleDataFetched}
                    />
                  </div>
                )}
                <div className="col-span-full">
                  <MBTIAnalysis />
                </div>
                <div className="col-span-full">
                  <ChatImageGenerator />
                </div>
              </div>
            </div>
            <div className={cn(isDrillDown ? "block" : "hidden", "flex-grow")}>
              <DrillDownSentiment
                chartData={chartData.sentiments}
                allMajorEvents={chartData.allMajorEvents}
                onClose={handleCloseDrillDown}
              />
            </div>
          </GradientPaperComponent>
        </div>
      </div>
      <footer className="w-full border-t bg-card mt-auto">
        <div className="container max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-4 md:px-8">
          <div className="flex flex-col gap-4 sm:gap-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
              <DiscordAndShop />
              <div className="flex items-center w-full sm:w-auto justify-center sm:justify-start mt-3 sm:mt-0">
                <Button
                  variant="outline"
                  size={isMobile ? "default" : "lg"}
                  asChild
                  className="font-semibold w-full sm:w-auto"
                >
                  <a
                    href="https://www.reddit.com/r/mosaicchats/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 justify-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      className="h-4 w-4 sm:h-5 sm:w-5 fill-current"
                    >
                      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
                    </svg>
                    <span className="text-sm sm:text-base">Join our Community</span>
                  </a>
                </Button>
              </div>
            </div>
            <div className="text-center text-xs sm:text-sm text-muted-foreground">
              © {new Date().getFullYear()} Mosaic. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
      <UserModal
        key={users?.reduce((acc, user) => acc + user.name + user.username, "")}
        open={Boolean(users?.every((user) => !user.edited)) && showUserModal}
        users={users || []}
        onClose={() => {
          setShowUserModal(false);
        }}
        setUsers={(users) => {
          setUsers(users);
          uploadJsonToS3(`chat/${hash}/people.json`, users);
        }}
      />
    </div>
  ) : null;
};

export default HomePage;

"use client";

import { cn } from "@/lib/utils";
import { Clip } from "@/lib/utils/clipDetection";
import { getOwnedFiles } from "@/lib/utils/hashAuthentication";
import { requestFile } from "@/lib/utils/s3cache";
import { signOut } from "aws-amplify/auth";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import { DashboardBackground } from "../custom/user-dashboard/components/UserBackground";
import CustomDrawer from "../custom/user-dashboard/CustomDrawer";
import Header from "../custom/user-dashboard/Header";
import { ClipGalleryContent } from "./components/ClipGalleryContent";

interface ChatMessage {
  user: string;
  message: string;
  index: number;
}

const ClipDashboard: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [ownedHashes, setOwnedHashes] = useState<string[]>([]);
  const [allClips, setAllClips] = useState<Array<{ clip: Clip; hash: string }>>(
    []
  );
  const [chatCategories, setChatCategories] = useState<Record<string, string>>(
    {}
  );
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme?.includes("dark");
  const currentScheme =
    theme?.replace("dark-", "").replace("light-", "") || "default";

  useEffect(() => {
    async function fetchAllClips() {
      try {
        // Step 1: Get hashes
        const hashes = await getOwnedFiles();
        console.log("1. Got hashes:", hashes);
        setOwnedHashes(hashes);

        // Step 2: Get categories for each hash
        const categories = await Promise.all(
          hashes.map(async (hash) => {
            try {
              const imagePromptData = await requestFile(
                `chat/${hash}/image-prompt.json`,
                hash,
                "fake token",
                () => Promise.resolve("fake token"),
                false
              );
              return {
                hash,
                category:
                  imagePromptData?.chatCategory?.toLowerCase() || "default",
              };
            } catch (error) {
              console.error(`Error fetching category for hash ${hash}:`, error);
              return { hash, category: "default" };
            }
          })
        );

        // Create categories object
        const categoriesObj = Object.fromEntries(
          categories.map(({ hash, category }) => [hash, category])
        );
        setChatCategories(categoriesObj);

        // Step 3: Get clips for each hash
        const clipsFromAllChats = await Promise.all(
          hashes.map(async (hash) => {
            try {
              const clipData = await requestFile(
                `chat/${hash}/viral-clips.json`,
                hash,
                "fake token",
                () => Promise.resolve("fake token"),
                false
              );
              console.log(`2. Clip data for ${hash}:`, clipData);

              if (!clipData?.clips) return [];

              // Map clips to include hash
              const clipsWithHash = clipData.clips.map((clip: Clip) => ({
                clip,
                hash,
              }));
              console.log(`3. Clips with hash for ${hash}:`, clipsWithHash);

              return clipsWithHash;
            } catch (error) {
              console.error(`Error fetching clips for hash ${hash}:`, error);
              return [];
            }
          })
        );

        const flattenedClips = clipsFromAllChats.flat();
        console.log("4. All flattened clips:", flattenedClips);
        setAllClips(flattenedClips);
      } catch (error) {
        console.error("Top level error:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAllClips();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const toggleDrawer = useCallback(
    (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
      if (
        event.type === "keydown" &&
        ((event as React.KeyboardEvent).key === "Tab" ||
          (event as React.KeyboardEvent).key === "Shift")
      ) {
        return;
      }
      setDrawerOpen(open);
    },
    []
  );

  if (isLoading) {
    return (
      <DashboardBackground>
        <div className="h-screen w-full flex flex-col items-center justify-center">
          <div className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground mt-4">Loading your clips...</p>
        </div>
      </DashboardBackground>
    );
  }

  return (
    <DashboardBackground>
      <div
        className={cn("min-h-screen flex flex-col", isDark ? "dark" : "")}
        data-theme={currentScheme}
      >
        <Header
          user={user}
          toggleDrawer={toggleDrawer}
          handleSignOut={handleSignOut}
          boardType="ClipBoard"
        />
        <CustomDrawer
          drawerOpen={drawerOpen}
          toggleDrawer={toggleDrawer}
          handleSignOut={handleSignOut}
        />
        <ClipGalleryContent
          clips={allClips}
          ownedHashes={ownedHashes}
          chatCategories={chatCategories}
        />
      </div>
    </DashboardBackground>
  );
};

export default ClipDashboard;
